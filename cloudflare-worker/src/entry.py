from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from workers import asgi, fetch, env
from workers.utils import import_from_javascript
from urllib.parse import urlencode
import hashlib
import uuid
import base64
import secrets
import string

from js import crypto, TextEncoder, Uint8Array, atob, btoa
from pyodide.ffi import to_js

app = FastAPI()
async def upload_to_supabase(env, file, folder):
    supabase_url = str(env.SUPABASE_URL)
    supabase_key = env.SUPABASE_KEY

    file_bytes = await file.read()

    original_name = file.filename or "image"
    safe_name = original_name.replace("\\", "_").replace("/", "_")
    filename = f"{uuid.uuid4()}_{safe_name}"
    path = f"{folder}/{filename}"

    upload_url = (
        f"{supabase_url}/storage/v1/object/"
        f"powerchoice-images/{path}"
    )

    response = await fetch(
    upload_url,
    method="POST",
    headers={
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key,
        "Content-Type": file.content_type or "application/octet-stream",
        "x-upsert": "true",
    },
    body=file_bytes,
)
    

    if not response.ok:
        error_text = await response.text()
        return {
            "success": False,
            "error": error_text,
            "status_code": response.status,
        }

    public_url = (
        f"{supabase_url}/storage/v1/object/public/"
        f"powerchoice-images/{path}"
    )

    return {
        "success": True,
        "filename": filename,
        "path": path,
        "url": public_url,
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{path:path}")
async def cors_preflight(path: str):
    return {}


@app.get("/")
async def root():
    return {"message": "PowerChoice Cloudflare Worker is running"}

@app.get("/referral/check")
async def check_referral(code: str):
    if code == "ABC123":
        return {
            "valid": True,
            "code": code,
            "message": "Referral code is valid"
        }

    return {
        "valid": False,
        "code": code,
        "message": "Invalid referral code"
    }



@app.get("/referral/check-domain")
async def check_domain(domain: str):
    domain = domain.strip().lower()

    cloudflare_token = env.CLOUDFLARE_API_TOKEN
    account_id = env.CLOUDFLARE_ACCOUNT_ID

    response = await fetch(
        f"https://api.cloudflare.com/client/v4/accounts/{account_id}/registrar/domain-check",
        method="POST",
        headers={
            "Authorization": f"Bearer {cloudflare_token}",
            "Content-Type": "application/json",
        },
        body='{"domains":["' + domain + '"]}',
    )

    data = await response.json()

    if not response.ok or not data.get("success"):
        return {
            "success": False,
            "available": False,
            "status_code": response.status,
            "message": "Cloudflare domain check failed",
            "cloudflare_response": data,
        }

    domains = data.get("result", {}).get("domains", [])

    if not domains:
        return {
            "success": False,
            "available": False,
            "message": "Cloudflare did not return a result for this domain.",
        }

    result = domains[0]

    return {
        "success": True,
        "domain": result.get("name", domain),
        "available": result.get("registrable") is True,
        "reason": result.get("reason"),
        "pricing": result.get("pricing"),
        "tier": result.get("tier"),
    }



@app.get("/test-db")
async def test_db(request: Request):
    env = request.scope["env"]
    result = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM profiles"
    ).first()

    return {
        "database": "powerchoice-db",
        "profiles_count": result["count"],
    }


@app.get("/profile/{profile_token}")
async def get_profile(profile_token: str, request: Request):
    env = request.scope["env"]

    result = await env.DB.prepare(
        "SELECT * FROM profiles WHERE profile_token = ?"
    ).bind(profile_token).first()

    if not result:
        return {"error": "Profile not found"}

    return dict(result)


@app.put("/profile/{profile_token}")
async def update_profile(profile_token: str, request: Request):
    env = request.scope["env"]
    data = await request.json()

    result = await env.DB.prepare(
        """
        UPDATE profiles
        SET
            store_name = ?,
            logo_type = ?,
            logo = ?,
            hero_image = ?,
            facebook = ?,
            instagram = ?,
            tiktok = ?,
            twitter = ?,
            address = ?,
            email = ?,
            phone = ?,
            whatsapp = ?,
            ceo_name = ?,
            tagline = ?,
            description = ?
        WHERE profile_token = ?
        """
    ).bind(
        data.get("store_name", ""),
        data.get("logo_type", ""),
        data.get("logo", ""),
        data.get("hero_image", ""),
        data.get("facebook", ""),
        data.get("instagram", ""),
        data.get("tiktok", ""),
        data.get("twitter", ""),
        data.get("address", ""),
        data.get("email", ""),
        data.get("phone", ""),
        data.get("whatsapp", ""),
        data.get("ceo_name", ""),
        data.get("tagline", ""),
        data.get("description", ""),
        profile_token,
    ).run()

    if result.meta.changes == 0:
        return {"error": "Profile not found"}

    updated = await env.DB.prepare(
        "SELECT * FROM profiles WHERE profile_token = ?"
    ).bind(profile_token).first()

    return dict(updated)

@app.get("/products")
async def get_products(request: Request):
    env = request.scope["env"]

    result = await env.DB.prepare(
        "SELECT * FROM products ORDER BY id"
    ).all()

    return [dict(row) for row in result.results]



@app.get("/debug/supabase")
async def debug_supabase(request: Request):
    request_env = request.scope["env"]

    request_value = request_env.SUPABASE_URL
    global_value = env.SUPABASE_URL

    return {
        "request_env_type": type(request_env).__name__,
        "request_value_type": type(request_value).__name__,
        "request_value_length": len(str(request_value)),
        "global_value_type": type(global_value).__name__,
        "global_value_length": len(str(global_value)),
        "global_has_http": "http" in str(global_value),
        "global_has_supabase": "supabase" in str(global_value),
    }




@app.get("/debug/env")
async def debug_env(request: Request):
    workers_module = import_from_javascript("cloudflare:workers")
    js_env = workers_module.env

    def inspect_value(value):
        try:
            value_string = str(value)
            return {
                "type": type(value).__name__,
                "length": len(value_string),
                "codepoint": (
                    ord(value_string[0])
                    if value_string
                    else None
                ),
            }
        except Exception as e:
            return {
                "error": type(e).__name__,
                "message": str(e),
            }

    return {
        "js_env_type": type(js_env).__name__,

        "secret_supabase_url": inspect_value(
            js_env.SUPABASE_URL
        ),
        "secret_supabase_key": inspect_value(
            js_env.SUPABASE_KEY
        ),
        "secret_test": inspect_value(
            js_env.TEST_SECRET
        ),

        "normal_test_value": inspect_value(
            js_env.TEST_VALUE
        ),
        "normal_supabase_url": inspect_value(
            js_env.TEST_SUPABASE_URL
        ),
        "normal_supabase_key": inspect_value(
            js_env.TEST_SUPABASE_KEY
        ),
    }






@app.post("/profile/logo")
async def upload_profile_logo(
    request: Request,
    file: UploadFile = File(...),
):
    env = request.scope["env"]

    result = await upload_to_supabase(
        env,
        file,
        "logos",
    )

    if not result["success"]:
        return result

    return result



@app.post("/profile/hero")
async def upload_profile_hero(
    request: Request,
    file: UploadFile = File(...),
):
    env = request.scope["env"]

    result = await upload_to_supabase(
        env,
        file,
        "heroes",
    )

    if not result["success"]:
        return result

    return result


@app.post("/products/upload")
async def upload_product_image(
    request: Request,
    file: UploadFile = File(...),
):
    env = request.scope["env"]

    result = await upload_to_supabase(
        env,
        file,
        "products",
    )

    if not result["success"]:
        return result

    return result



@app.post("/products")
async def create_product(request: Request):
    env = request.scope["env"]
    data = await request.json()

    result = await env.DB.prepare(
        """
        INSERT INTO products
        (name, original_price, discount, price, description, image)
        VALUES (?, ?, ?, ?, ?, ?)
        """
    ).bind(
        data["name"],
        data["original_price"],
        data.get("discount", 0),
        data["price"],
        data["description"],
        data.get("image"),
    ).run()

    product = await env.DB.prepare(
        "SELECT * FROM products WHERE id = ?"
    ).bind(result.meta.last_row_id).first()

    return dict(product)

@app.put("/products/{product_id}")
async def update_product(product_id: int, request: Request):
    env = request.scope["env"]
    data = await request.json()

    existing = await env.DB.prepare(
        "SELECT * FROM products WHERE id = ?"
    ).bind(product_id).first()

    if not existing:
        return {"error": "Product not found"}

    await env.DB.prepare(
        """
        UPDATE products
        SET
            name = ?,
            original_price = ?,
            discount = ?,
            price = ?,
            description = ?,
            image = ?
        WHERE id = ?
        """
    ).bind(
        data["name"],
        data["original_price"],
        data.get("discount", 0),
        data["price"],
        data["description"],
        data.get("image"),
        product_id,
    ).run()

    updated = await env.DB.prepare(
        "SELECT * FROM products WHERE id = ?"
    ).bind(product_id).first()

    return dict(updated)


@app.delete("/products/{product_id}")
async def delete_product(product_id: int, request: Request):
    env = request.scope["env"]

    existing = await env.DB.prepare(
        "SELECT * FROM products WHERE id = ?"
    ).bind(product_id).first()

    if not existing:
        return {"error": "Product not found"}

    await env.DB.prepare(
        "DELETE FROM products WHERE id = ?"
    ).bind(product_id).run()

    return {"message": "Product deleted successfully"}


@app.get("/reviews")
async def get_reviews(request: Request):
    env = request.scope["env"]

    result = await env.DB.prepare(
        "SELECT * FROM reviews ORDER BY id"
    ).all()

    return [dict(row) for row in result.results]

@app.post("/reviews")
async def create_review(request: Request):
    env = request.scope["env"]
    data = await request.json()

    result = await env.DB.prepare(
        """
        INSERT INTO reviews
        (customer_name, comment, rating)
        VALUES (?, ?, ?)
        """
    ).bind(
        data["customer_name"],
        data["comment"],
        data["rating"],
    ).run()

    review = await env.DB.prepare(
        "SELECT * FROM reviews WHERE id = ?"
    ).bind(result.meta.last_row_id).first()

    return dict(review)

@app.put("/reviews/{review_id}")
async def update_review(review_id: int, request: Request):
    env = request.scope["env"]
    data = await request.json()

    existing = await env.DB.prepare(
        "SELECT * FROM reviews WHERE id = ?"
    ).bind(review_id).first()

    if not existing:
        return {"error": "Review not found"}

    await env.DB.prepare(
        """
        UPDATE reviews
        SET
            customer_name = ?,
            comment = ?,
            rating = ?
        WHERE id = ?
        """
    ).bind(
        data["customer_name"],
        data["comment"],
        data["rating"],
        review_id,
    ).run()

    updated = await env.DB.prepare(
        "SELECT * FROM reviews WHERE id = ?"
    ).bind(review_id).first()

    return dict(updated)

@app.delete("/reviews/{review_id}")
async def delete_review(review_id: int, request: Request):
    env = request.scope["env"]

    existing = await env.DB.prepare(
        "SELECT * FROM reviews WHERE id = ?"
    ).bind(review_id).first()

    if not existing:
        return {"error": "Review not found"}

    await env.DB.prepare(
        "DELETE FROM reviews WHERE id = ?"
    ).bind(review_id).run()

    return {"message": "Review deleted successfully"}




@app.get("/test-flutterwave")
async def test_flutterwave(request: Request):
    env = request.scope["env"]

    client_id = env.FLW_CLIENT_ID
    client_secret = env.FLW_CLIENT_SECRET

    body = urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
    })

    response = await fetch(
    "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token",
    method="POST",
    headers={
        "Content-Type": "application/x-www-form-urlencoded",
    },
    body=body,
)
    

    data = await response.json()

    return {
        "success": response.ok,
        "status_code": response.status,
        "token_received": "access_token" in data,
        "expires_in": data.get("expires_in"),
        "flutterwave_error": data.get("error"),
        "flutterwave_error_description": data.get("error_description"),
    }


@app.get("/debug/flutterwave-charge/{reference}")
async def debug_flutterwave_charge(reference: str, request: Request):
    env = request.scope["env"]

    client_id = env.FLW_CLIENT_ID
    client_secret = env.FLW_CLIENT_SECRET

    body = urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
    })

    token_response = await fetch(
        "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token",
        method="POST",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body=body,
    )

    token_data = await token_response.json()

    access_token = token_data.get("access_token")

    if not access_token:
        return {
            "success": False,
            "message": "Could not obtain Flutterwave access token",
        }

    response = await fetch(
        "https://developersandbox-api.flutterwave.com/charges?"
        + urlencode({
            "reference": reference,
            "size": 10,
        }),
        method="GET",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        },
    )

    data = await response.json()

    return {
        "success": response.ok,
        "status_code": response.status,
        "data": data,
    }


@app.get("/test-flutterwave-secret")
async def test_flutterwave_secret(request: Request):
    env = request.scope["env"]

    client_id = env.FLW_CLIENT_ID
    client_secret = env.FLW_CLIENT_SECRET

    return {
        "client_id_length": len(client_id),
        "client_secret_length": len(client_secret),
        "client_id_hash": hashlib.sha256(
            client_id.encode()
        ).hexdigest(),
        "client_secret_hash": hashlib.sha256(
            client_secret.encode()
        ).hexdigest(),
    }





@app.get("/test-profile-schema")
async def test_profile_schema(request: Request):
    env = request.scope["env"]
    result = await env.DB.prepare(
        "PRAGMA table_info(profiles)"
    ).all()
    return [dict(row) for row in result.results]


@app.get("/test-products-schema")
async def test_products_schema(request: Request):
    env = request.scope["env"]
    result = await env.DB.prepare(
        "PRAGMA table_info(products)"
    ).all()
    return [dict(row) for row in result.results]

@app.get("/test-reviews-schema")
async def test_reviews_schema(request: Request):
    env = request.scope["env"]
    result = await env.DB.prepare(
        "PRAGMA table_info(reviews)"
    ).all()
    return [dict(row) for row in result.results]



@app.post("/payment/create")
async def create_payment(request: Request):
    env = request.scope["env"]

    data = await request.json()

    # ---------------------------------
    # Customer information
    # ---------------------------------

    company_name = str(data.get("company_name", "")).strip()
    domain = str(data.get("domain", "")).strip()
    email = str(data.get("email", "")).strip()

    # ---------------------------------
    # Card information
    #
    # These are used only for the
    # Flutterwave charge.
    #
    # Do NOT store them in D1 or logs.
    # ---------------------------------

    card_number = str(data.get("card_number", "")).strip()
    expiry_month = str(data.get("expiry_month", "")).strip()
    expiry_year = str(data.get("expiry_year", "")).strip()
    cvv = str(data.get("cvv", "")).strip()

    if not company_name or not domain or not email:
        return {
            "success": False,
            "message": "Company name, domain, and email are required",
        }

    if not card_number or not expiry_month or not expiry_year or not cvv:
        return {
            "success": False,
            "message": "Card number, expiry month, expiry year, and CVV are required",
        }

    # ---------------------------------
    # Payment details
    # ---------------------------------

    amount = 80000
    currency = "NGN"

    # ---------------------------------
    # Generate unique payment reference
    # ---------------------------------

    reference = f"PC-{uuid.uuid4().hex[:24]}"

    # ---------------------------------
    # Save payment as PENDING in D1
    #
    # This happens BEFORE sending the
    # card charge to Flutterwave.
    # ---------------------------------

    await env.DB.prepare(
        """
        INSERT INTO payments (
            reference,
            company_name,
            domain,
            email,
            amount,
            currency,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """
    ).bind(
        reference,
        company_name,
        domain,
        email,
        amount,
        currency,
        "pending",
    ).run()

    # ---------------------------------
    # Get Flutterwave encryption key
    # ---------------------------------

    encryption_key = env.FLW_ENCRYPTION_KEY

    # ---------------------------------
    # Generate Flutterwave nonce
    #
    # Flutterwave v4 requires a
    # 12-character nonce.
    # ---------------------------------

    nonce = "".join(
        secrets.choice(string.ascii_letters + string.digits)
        for _ in range(12)
    )

    # ---------------------------------
    # Encrypt card values with AES-256
    # ---------------------------------

    try:
        key_bytes = Uint8Array.new(
            base64.b64decode(encryption_key)
        )

        key = await crypto.subtle.importKey(
            "raw",
            key_bytes,
            {"name": "AES-GCM"},
            False,
            to_js(["encrypt"]),
        )

        encoder = TextEncoder.new()
        iv = encoder.encode(nonce)

        async def encrypt_value(value):
            encrypted = await crypto.subtle.encrypt(
                {
                    "name": "AES-GCM",
                    "iv": iv,
                },
                key,
                encoder.encode(str(value)),
            )

            encrypted_bytes = Uint8Array.new(encrypted)

            return btoa(
                "".join(
                    chr(int(byte))
                    for byte in encrypted_bytes
                )
            )

        encrypted_card_number = await encrypt_value(card_number)
        encrypted_expiry_month = await encrypt_value(expiry_month)
        encrypted_expiry_year = await encrypt_value(expiry_year)
        encrypted_cvv = await encrypt_value(cvv)

    except Exception:
        # ---------------------------------
        # Encryption failed
        #
        # Mark the pending payment as
        # failed. Card data is NOT stored.
        # ---------------------------------

        await env.DB.prepare(
            """
            UPDATE payments
            SET
                status = ?,
                flutterwave_status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE reference = ?
            """
        ).bind(
            "failed",
            "encryption_failed",
            reference,
        ).run()

        return {
            "success": False,
            "message": "Failed to encrypt card details",
        }

    # ---------------------------------
    # Get Flutterwave OAuth token
    # ---------------------------------

    client_id = env.FLW_CLIENT_ID
    client_secret = env.FLW_CLIENT_SECRET

    token_body = urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
    })

    token_response = await fetch(
        "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token",
        method="POST",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body=token_body,
    )

    token_data = await token_response.json()

    if not token_response.ok or "access_token" not in token_data:
        # ---------------------------------
        # Flutterwave authentication failed
        # ---------------------------------

        await env.DB.prepare(
            """
            UPDATE payments
            SET
                status = ?,
                flutterwave_status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE reference = ?
            """
        ).bind(
            "failed",
            "authentication_failed",
            reference,
        ).run()

        return {
            "success": False,
            "message": "Flutterwave authentication failed",
            "status_code": token_response.status,
        }

    access_token = token_data["access_token"]

    # ---------------------------------
    # Flutterwave v4 direct charge
    # ---------------------------------

    payment_body = {
        "amount": amount,
        "currency": currency,
        "reference": reference,

        "customer": {
            "email": email,
            "name": {
                "first": company_name,
            },
        },

        "payment_method": {
            "type": "card",
            "card": {
                "nonce": nonce,
                "encrypted_expiry_year": encrypted_expiry_year,
                "encrypted_card_number": encrypted_card_number,
                "encrypted_expiry_month": encrypted_expiry_month,
                "encrypted_cvv": encrypted_cvv,
            },
        },

        "redirect_url": f"https://powerchoice.pages.dev/payment/callback?reference={reference}",

        "meta": {
            "company_name": company_name,
            "domain": domain,
        },
    }

    # ---------------------------------
    # Send charge to Flutterwave Sandbox
    # ---------------------------------

    payment_response = await fetch(
        "https://developersandbox-api.flutterwave.com/orchestration/direct-charges",
        method="POST",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Trace-Id": str(uuid.uuid4()),
            "X-Idempotency-Key": str(uuid.uuid4()),
            "X-Scenario-Key": "scenario:auth_3ds&issuer:approved",
        },
        body=__import__("json").dumps(payment_body),
    )

    payment_data = await payment_response.json()

    # ---------------------------------
    # If Flutterwave rejects the charge
    # at the API level, mark payment
    # as failed.
    # ---------------------------------

    if not payment_response.ok:
        flutterwave_status = None

        if isinstance(payment_data, dict):
            flutterwave_data = payment_data.get("data") or {}

            if isinstance(flutterwave_data, dict):
                flutterwave_status = flutterwave_data.get("status")

        await env.DB.prepare(
            """
            UPDATE payments
            SET
                status = ?,
                flutterwave_status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE reference = ?
            """
        ).bind(
            "failed",
            flutterwave_status or "failed",
            reference,
        ).run()

    # ---------------------------------
    # Return response to frontend
    # ---------------------------------

    return {
        "success": payment_response.ok,
        "status_code": payment_response.status,
        "reference": reference,
        "flutterwave": payment_data,
    }




@app.get("/payment/status/{reference}")
async def payment_status(reference: str, request: Request):
    env = request.scope["env"]

    payment = await env.DB.prepare(
        """
        SELECT
            reference,
            company_name,
            domain,
            email,
            amount,
            currency,
            status,
            flutterwave_status,
            profile_token
        FROM payments
        WHERE reference = ?
        """
    ).bind(reference).first()

    if not payment:
        return {
            "success": False,
            "status": "not_found",
            "message": "Payment not found",
        }

    return {
        "success": True,
        "reference": payment["reference"],
        "status": payment["status"],
        "flutterwave_status": payment["flutterwave_status"],
        "profile_token": payment["profile_token"],
    }




@app.post("/payment/webhook")
async def payment_webhook(request: Request):
    env = request.scope["env"]

    # ---------------------------------
    # Verify Flutterwave webhook secret
    # ---------------------------------

    incoming_secret = request.headers.get("verif-hash", "")

    if not incoming_secret or incoming_secret != env.FLW_WEBHOOK_SECRET:
        return {
            "success": False,
            "message": "Invalid webhook signature",
        }

    # ---------------------------------
    # Read webhook payload
    # ---------------------------------

    data = await request.json()

    event_type = data.get("event")
    event_data = data.get("data", {})

    reference = event_data.get("reference")
    flutterwave_status = event_data.get("status")
    transaction_id = event_data.get("id")

    if not reference:
        return {
            "success": False,
            "message": "Payment reference missing",
        }

    # ---------------------------------
    # Find the payment that was created
    # by /payment/create
    # ---------------------------------

    existing_payment = await env.DB.prepare(
        """
        SELECT
            id,
            reference,
            company_name,
            domain,
            email,
            amount,
            currency,
            status,
            profile_token
        FROM payments
        WHERE reference = ?
        """
    ).bind(reference).first()

    # ---------------------------------
    # Payment must already exist in D1
    #
    # This prevents an unknown webhook
    # from creating a profile.
    # ---------------------------------

    if not existing_payment:
        print(
            "WEBHOOK PAYMENT NOT FOUND:",
            {
                "reference": reference,
                "event": event_type,
                "status": flutterwave_status,
            },
        )

        return {
            "success": False,
            "message": "Payment record not found",
            "reference": reference,
        }

    # ---------------------------------
    # Use the original customer data
    # saved during /payment/create
    # ---------------------------------

    company_name = existing_payment.get("company_name") or ""
    domain = existing_payment.get("domain") or ""
    email = existing_payment.get("email") or ""

    amount = existing_payment.get("amount") or 80000
    currency = existing_payment.get("currency") or "NGN"

    existing_profile_token = existing_payment.get("profile_token")

    # ---------------------------------
    # Determine local payment status
    # ---------------------------------

    payment_is_successful = flutterwave_status in ("successful", "succeeded")

    payment_status = (
        "paid"
        if payment_is_successful
        else flutterwave_status or "pending"
    )



    # ---------------------------------
    # Update the existing payment
    #
    # IMPORTANT:
    # We do NOT overwrite company_name,
    # domain, or email with webhook data.
    # ---------------------------------

    await env.DB.prepare(
        """
        UPDATE payments
        SET
            amount = ?,
            currency = ?,
            status = ?,
            flutterwave_status = ?,
            transaction_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE reference = ?
        """
    ).bind(
        amount,
        currency,
        payment_status,
        flutterwave_status,
        str(transaction_id)
        if transaction_id is not None
        else None,
        reference,
    ).run()

    # ---------------------------------
    # Only create profile after
    # successful payment
    # ---------------------------------

    if not payment_is_successful:
        print(
            "FLUTTERWAVE WEBHOOK:",
            {
                "event": event_type,
                "reference": reference,
                "status": flutterwave_status,
                "transaction_id": transaction_id,
            },
        )

        return {
            "success": True,
            "message": "Webhook received",
            "reference": reference,
            "status": flutterwave_status,
        }

    # ---------------------------------
    # Profile already created
    # ---------------------------------

    if existing_profile_token:
        print(
            "PROFILE ALREADY CREATED:",
            {
                "reference": reference,
                "profile_token": existing_profile_token,
            },
        )

        return {
            "success": True,
            "message": "Payment already processed",
            "reference": reference,
            "profile_token": existing_profile_token,
        }

    # ---------------------------------
    # Generate unique profile token
    # ---------------------------------

    profile_token = None

    for _ in range(5):

        candidate_token = secrets.token_urlsafe(32)

        existing_profile = await env.DB.prepare(
            """
            SELECT id
            FROM profiles
            WHERE profile_token = ?
            """
        ).bind(candidate_token).first()

        if not existing_profile:
            profile_token = candidate_token
            break

    if not profile_token:
        return {
            "success": False,
            "message": "Could not generate a unique profile token",
        }

    # ---------------------------------
    # Create user's profile
    # ---------------------------------

    profile_result = await env.DB.prepare(
        """
        INSERT INTO profiles (
            profile_token,
            store_name,
            email,
            domain
        )
        VALUES (?, ?, ?, ?)
        """
    ).bind(
        profile_token,
        company_name,
        email,
        domain
    ).run()

    # ---------------------------------
    # Save profile token against payment
    # ---------------------------------

    await env.DB.prepare(
        """
        UPDATE payments
        SET
            profile_token = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE reference = ?
        """
    ).bind(
        profile_token,
        reference,
    ).run()

    # ---------------------------------
    # Log successful profile creation
    # ---------------------------------

    print(
        "PROFILE CREATED AFTER SUCCESSFUL PAYMENT:",
        {
            "reference": reference,
            "profile_id": profile_result.meta.last_row_id,
            "profile_token": profile_token,
            "company_name": company_name,
            "email": email,
        },
    )

    # ---------------------------------
    # Return success
    # ---------------------------------

    return {
        "success": True,
        "message": "Payment confirmed and profile created",
        "reference": reference,
        "profile_token": profile_token,
    }





Default = asgi.entrypoint(app)