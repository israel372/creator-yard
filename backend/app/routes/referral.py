import os
import requests
import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(
    prefix="/referral",
    tags=["Referral"]
)

REFERRALS_FILE = Path(__file__).resolve().parent.parent / "referrals.json"


def load_referrals():
    with open(REFERRALS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


@router.get("/check")
def check_referral(code: str):
    data = load_referrals()

    for referral in data.get("referrals", []):
        if referral.get("code") == code and referral.get("active") is True:
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

@router.get("/cloudflare-test")
def cloudflare_test():
    token = os.getenv("CLOUDFLARE_API_TOKEN")

    if not token:
        return {
            "success": False,
            "message": "Cloudflare API token not found"
        }

    response = requests.get(
        "https://api.cloudflare.com/client/v4/accounts",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )

    return {
        "success": response.ok,
        "status_code": response.status_code,
        "cloudflare_response": response.json()
    }



@router.get("/check-domain")
def check_domain(domain: str):
    token = os.getenv("CLOUDFLARE_API_TOKEN")
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")

    if not token:
        return {
            "success": False,
            "available": False,
            "message": "Cloudflare API token not found"
        }

    if not account_id:
        return {
            "success": False,
            "available": False,
            "message": "Cloudflare account ID not found"
        }

    domain = domain.strip().lower()

    response = requests.post(
        f"https://api.cloudflare.com/client/v4/accounts/{account_id}/registrar/domain-check",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "domains": [domain]
        },
        timeout=10
    )

    data = response.json()

    if not response.ok or not data.get("success"):
        return {
            "success": False,
            "available": False,
            "status_code": response.status_code,
            "message": "Cloudflare domain check failed",
            "cloudflare_response": data
        }

    domains = data.get("result", {}).get("domains", [])

    if not domains:
        return {
            "success": False,
            "available": False,
            "message": "Cloudflare did not return a result for this domain."
        }

    result = domains[0]

    return {
        "success": True,
        "domain": result.get("name", domain),
        "available": result.get("registrable") is True,
        "reason": result.get("reason"),
        "pricing": result.get("pricing"),
        "tier": result.get("tier")
    }



@router.get("/flutterwave-test")
def flutterwave_test():
    client_id = os.getenv("FLW_CLIENT_ID")
    client_secret = os.getenv("FLW_CLIENT_SECRET")

    if not client_id or not client_secret:
        return {
            "success": False,
            "message": "Flutterwave credentials not found"
        }

    response = requests.post(
        "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token",
        headers={
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "client_credentials"
        },
        timeout=15
    )

    data = response.json()

    if not response.ok or "access_token" not in data:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Flutterwave authentication failed",
            "response": data
        }

    return {
        "success": True,
        "message": "Flutterwave authentication successful",
        "token_type": data.get("token_type"),
        "expires_in": data.get("expires_in")
    }




