
import { useEffect, useState } from "react";
import { getPublishedRetailManagementContent } from "../api/api";
import Header from "../components/Header";
import Footer from "../components/footer";
import "./retailManagement.css";

const products = [
  { id: 1, name: "Peak Milk 400g", category: "Groceries", price: 4500, stock: 12 },
  { id: 2, name: "Rice 1kg", category: "Groceries", price: 2200, stock: 5 },
  { id: 3, name: "Golden Penny Pasta", category: "Groceries", price: 1800, stock: 18 },
  { id: 4, name: "Bottle Water", category: "Drinks", price: 500, stock: 4 },
  { id: 5, name: "Milo Refill Sachet", category: "Groceries", price: 1200, stock: 9 },
  { id: 6, name: "Soft Drink 50cl", category: "Drinks", price: 700, stock: 24 },
  { id: 7, name: "Bathing Soap", category: "Household", price: 950, stock: 3 },
  { id: 8, name: "Cooking Oil 1L", category: "Household", price: 3200, stock: 7 },
];
const money = (n) => new Intl.NumberFormat("en-NG", {
  style: "currency", currency: "NGN", maximumFractionDigits: 0,
}).format(n);

export default function RetailManagement() {
  const [cmsContent, setCmsContent] = useState(null);

  useEffect(() => {
    let active = true;

    getPublishedRetailManagementContent()
      .then((data) => {
        if (active && data?.content && typeof data.content === "object") {
          setCmsContent(data.content);
        }
      })
      .catch(() => {
        // Keep the existing page content if no CMS version is published.
      });

    return () => {
      active = false;
    };
  }, []);

  const [tab, setTab] = useState("pos");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [form, setForm] = useState({ name: "", business: "", phone: "", need: "POS and inventory setup" });

  const categories = ["All", ...new Set(products.map((p) => p.category))];
  const shown = products.filter((p) =>
    (p.name + p.category).toLowerCase().includes(search.toLowerCase()) &&
    (category === "All" || p.category === category)
  );
  const count = cart.reduce((sum, p) => sum + p.qty, 0);
  const total = cart.reduce((sum, p) => sum + p.price * p.qty, 0);
  const add = (p) => {
    setReceipt(null);
    setCart((old) => old.some((x) => x.id === p.id)
      ? old.map((x) => x.id === p.id ? { ...x, qty: x.qty + 1 } : x)
      : [...old, { ...p, qty: 1 }]);
  };
  const changeQty = (id, amount) => {
    setReceipt(null);
    setCart((old) => old.map((p) => p.id === id ? { ...p, qty: p.qty + amount } : p).filter((p) => p.qty > 0));
  };
  const checkout = () => {
    if (!cart.length) return;
    setReceipt({ ref: `DEMO-${Date.now().toString().slice(-6)}`, total, count });
    setCart([]);
  };
  const submitEnquiry = (event) => {
    event.preventDefault();

    const whatsappNumber = cmsContent?.contact?.whatsappNumber || "2347013415235";
    const enquiryMessage = [
      "Hello Creator Yard, I am interested in your retail POS system.",
      "",
      `Name: ${form.name.trim()}`,
      `Business: ${form.business.trim() || "Not provided"}`,
      `Phone/WhatsApp: ${form.phone.trim()}`,
      `Enquiry: ${form.need}`,
      "",
      "Please let me know about pricing, setup, and training."
    ].join("\n");

    const whatsappUrl =
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(enquiryMessage)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return <div className="retail-page">
    <Header />
    <main>
      <section className="rm-hero">
        <div className="rm-hero-inner">
          <div className="rm-hero-copy">
            <span className="rm-eyebrow"><i /> {cmsContent?.hero?.eyebrow || "CREATOR YARD · RETAIL SYSTEMS"}</span>
            <h1>{cmsContent?.hero?.heading || <>Know your stock.<br /><em>Own your numbers.</em></>}</h1>
            <p>{cmsContent?.hero?.description || "A practical point-of-sale and inventory system for everyday retail businesses. Sell with confidence, keep an eye on stock, and understand what your shop is doing."}</p>
            <div className="rm-actions"><a className="rm-button rm-primary" href="#rm-demo">{cmsContent?.hero?.primaryButton || "Explore the interactive demo"} <b>↘</b></a><a className="rm-button rm-outline" href="#rm-enquiry">{cmsContent?.hero?.secondaryButton || "Discuss an installation"}</a></div>
            <div className="rm-proof"><span><b>01</b> Sales & checkout</span><span><b>02</b> Stock visibility</span><span><b>03</b> Setup & training</span></div>
          </div>
          <div className="rm-hero-art">
            <div className="rm-art-orbit" />
            <div className="rm-art-dashboard">
              <div className="rm-art-top"><span>●</span> SHOP OVERVIEW <b>SAMPLE</b></div>
              <strong>₦86,400 <i>↗</i></strong><small>Illustrative sales today</small>
              <div className="rm-bars">{[32,50,39,67,48,78,58,92,70,100,65,84].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div>
              <div className="rm-days"><span>MON</span><span>WED</span><span>FRI</span><span>SUN</span></div>
            </div>
            <div className="rm-float rm-float-stock"><b>↘</b><span><small>LOW STOCK ALERT</small><strong>3 items</strong></span></div>
            <div className="rm-float rm-float-ready"><b>✓</b><span><strong>Checkout ready</strong><small>Sample environment</small></span></div>
            <div className="rm-sticker">BUILT FOR<br /><b>REAL SHOPS</b></div>
          </div>
        </div>
        <div className="rm-hero-bottom"><span>BUILT FOR THE WAY YOUR BUSINESS WORKS</span><span>LOCAL RETAIL · MINI-MARTS · PROVISION STORES</span></div>
      </section>

      {cmsContent?.benefits?.visible !== false && (
        <section className="rm-benefits rm-shell">
          <span className="rm-eyebrow">{cmsContent?.benefits?.eyebrow || "LESS GUESSWORK. MORE CONTROL."}</span>
          <h2>{cmsContent?.benefits?.heading || <>The daily shop routine,<br /><em>made clearer.</em></>}</h2>
          <div className="rm-benefit-grid">
            {(Array.isArray(cmsContent?.benefits?.items) && cmsContent.benefits.items.length
              ? cmsContent.benefits.items
              : [
                  { title: "Checkout that makes sense", description: "Find products, build a basket, and see the total before completing a sale." },
                  { title: "Know what is on your shelf", description: "Keep product quantities and low-stock items visible so restocking is less of a guess." },
                  { title: "Make better shop decisions", description: "Use sales and stock reports to get a clearer picture of everyday business activity." },
                ]
            ).map((item, index) => (
              <article key={`${item.title || "benefit"}-${index}`}>
                <span>{["↗", "▤", "⌁"][index % 3]}</span>
                <small>{String(index + 1).padStart(2, "0")} / {["SELL", "TRACK", "UNDERSTAND"][index % 3]}</small>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {cmsContent?.pricing?.visible !== false && (
      <section className="rm-pricing-section" id="rm-pricing">
        <div className="rm-shell">
          <div className="rm-pricing-heading">
            <span className="rm-eyebrow">{cmsContent?.pricing?.heading || "STRAIGHTFORWARD PRICING"}</span>
            <h2>Your shop deserves<br /><em>better control.</em></h2>
            <p>{cmsContent?.pricing?.description || "Choose the Creator Yard POS package that fits your shop. Software, setup, and hardware are priced separately so you can plan your investment clearly."}</p>
          </div>
          <div className="rm-pricing-grid">
            <article className="rm-price-card">
              <span className="rm-price-kicker">01 · SOFTWARE</span>
              <h3>Creator Yard POS</h3>
              <p className="rm-price">{cmsContent?.pricing?.softwarePrice || "₦100,000"}</p>
              <p className="rm-price-description">A one-time purchase with a perpetual software licence. Software updates and ongoing support are included in the ₦100,000 package.</p>
              <a className="rm-button rm-dark-button" href="#rm-enquiry">Ask about the software <b>↗</b></a>
            </article>
            <article className="rm-price-card rm-price-featured">
              <span className="rm-price-kicker">02 · IMPLEMENTATION</span>
              <h3>Installation & setup</h3>
              <p className="rm-price">{cmsContent?.pricing?.setupPrice || "From ₦50,000"}</p>
              <p className="rm-price-description">Installation, initial configuration and shop setup, priced according to your business requirements.</p>
              <a className="rm-button rm-primary" href="#rm-enquiry">Plan my installation <b>↗</b></a>
            </article>
            {cmsContent?.device?.visible !== false && (
              <article className="rm-price-card rm-device-card">
                <span className="rm-price-kicker">03 · HARDWARE</span>
                {cmsContent?.device?.imageUrl && (
                  <img
                    className="rm-device-image"
                    src={cmsContent.device.imageUrl}
                    alt={cmsContent?.device?.model || "Creator Yard POS tablet"}
                    loading="lazy"
                  />
                )}
                <h3>{cmsContent?.device?.heading || cmsContent?.device?.model || "X10PRO Android POS tablet"}</h3>
                <p className="rm-price">{cmsContent?.pricing?.devicePrice || "From ₦160,000"}</p>
                <p className="rm-price-description">
                  {cmsContent?.device?.description || "Our current POS tablet runs Android 10. Ask us about configuration, availability, installation, and support."}
                </p>
                {(cmsContent?.device?.androidVersion || cmsContent?.device?.buildVersion) && (
                  <p className="rm-device-specs">
                    {cmsContent?.device?.androidVersion && <span>{cmsContent.device.androidVersion}</span>}
                    {cmsContent?.device?.buildVersion && <span>Build: {cmsContent.device.buildVersion}</span>}
                  </p>
                )}
                <a className="rm-button rm-dark-button" href="#rm-enquiry">Ask about the POS tablet <b>↗</b></a>
              </article>
            )}
          </div>
          <p className="rm-pricing-note"><strong>Planning all three?</strong> The indicative starting budget is ₦310,000 for software, installation and setup, and an iPad at the listed starting prices. This is an estimate, not a fixed all-inclusive quote. Final cost depends on your setup and hardware selection.</p>
        </div>
      </section>


      )}
      <section className="rm-demo-section" id="rm-demo"><div className="rm-shell">
        <div className="rm-demo-heading"><div><span className="rm-eyebrow">{cmsContent?.demo?.heading || "TAKE IT FOR A TEST DRIVE"}</span><h2>A small shop.<br /><em>In your hands.</em></h2></div><p>{cmsContent?.demo?.description || "This interactive sample uses fictional products and figures. Add products to the basket, change quantities, and try a simulated checkout."}</p></div>
        <div className="rm-app">
          <div className="rm-app-top"><span className="rm-logo">CY</span><span><b>Creator Yard POS</b><small>Retail workspace</small></span><strong>● INTERACTIVE SAMPLE · NOT LIVE SHOP DATA</strong></div>
          <div className="rm-app-layout">
            <aside className="rm-sidebar"><small>WORKSPACE</small><button className={tab==="pos"?"active":""} onClick={()=>setTab("pos")}>▦ &nbsp; Point of sale</button><button className={tab==="inventory"?"active":""} onClick={()=>setTab("inventory")}>▤ &nbsp; Inventory</button><button className={tab==="reports"?"active":""} onClick={()=>setTab("reports")}>▥ &nbsp; Sales reports</button><div className="rm-sidebar-note"><b>Need help setting up?</b><small>Discuss installation and staff training for your shop.</small><a href="#rm-enquiry">Talk to us ↗</a></div></aside>
            <div className="rm-workspace">
              <div className="rm-workspace-head"><div><small>SAMPLE WORKSPACE / TODAY</small><h3>{tab==="pos"?"Point of sale":tab==="inventory"?"Inventory overview":"Sales overview"}</h3><p>{tab==="pos"?"Choose products to start a sample transaction.":tab==="inventory"?"Check sample quantities and identify items to restock.":"A quick look at illustrative sales activity."}</p></div><span>DEMO MODE</span></div>
              <div className="rm-stats"><div><small>Sample sales today</small><b>₦86,400</b><span>Illustrative figure</span></div><div><small>Products in sample</small><b>48</b><span>Demo catalogue</span></div><div><small>Low-stock products</small><b className="rm-alert">3</b><span>Sample alert count</span></div></div>
              {tab==="pos" && <div className="rm-pos">
                <div className="rm-products"><div className="rm-panel-heading"><b>Products</b><small>{shown.length} shown</small></div><input aria-label="Search sample products" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product…" /><div className="rm-categories">{categories.map(c=><button key={c} className={c===category?"selected":""} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="rm-product-grid">{shown.map((p,i)=><button className="rm-product" key={p.id} onClick={()=>add(p)}><span className={`rm-product-icon rm-icon-${i%4}`}>{p.category==="Drinks"?"◉":p.category==="Household"?"✳":"▧"}</span><b>{p.name}</b><strong>{money(p.price)}</strong><small>{p.stock} in sample stock</small><em>+ Add</em></button>)}{!shown.length&&<p>No sample products match that search.</p>}</div></div>
                <div className="rm-cart"><div className="rm-panel-heading"><span><b>Current sale</b><small>Sample receipt</small></span><strong>{count} items</strong></div><div className="rm-cart-items">{!cart.length&&!receipt&&<div className="rm-empty"><b>＋</b><strong>Your basket is empty</strong><small>Add a product from the sample catalogue.</small></div>}{cart.map(p=><div className="rm-cart-item" key={p.id}><span><b>{p.name}</b><small>{money(p.price)} each</small><span className="rm-qty"><button aria-label={`Decrease ${p.name}`} onClick={()=>changeQty(p.id,-1)}>−</button><i>{p.qty}</i><button aria-label={`Increase ${p.name}`} onClick={()=>changeQty(p.id,1)}>+</button></span></span><strong>{money(p.price*p.qty)}</strong></div>)}{receipt&&<div className="rm-receipt"><b>✓</b><strong>Demo sale completed</strong><small>Ref: {receipt.ref}</small><h3>{money(receipt.total)}</h3><button onClick={()=>setReceipt(null)}>Start another sample sale</button></div>}</div><div className="rm-cart-total"><span>Subtotal <b>{money(total)}</b></span><span>Tax <b>₦0</b></span><strong>Total <b>{money(total)}</b></strong><button disabled={!cart.length} onClick={checkout}>Complete demo sale <b>→</b></button><small>No payment is collected. Real stock is not changed.</small></div></div>
              </div>}
              {tab==="inventory" && <div className="rm-table-wrap"><div className="rm-panel-heading"><b>Sample inventory</b><small>Fictional stock levels</small></div><table><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Status</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><b>{p.name}</b></td><td>{p.category}</td><td>{p.stock}</td><td><span className={p.stock<=5?"rm-low-pill":"rm-good-pill"}>{p.stock<=5?"Restock soon":"In stock"}</span></td></tr>)}</tbody></table><small className="rm-footnote">Eight fictional products shown. Your shop's data is not connected to this website.</small></div>}
              {tab==="reports" && <div className="rm-reports"><div className="rm-report-card"><small>ILLUSTRATIVE SALES TOTAL</small><b>₦86,400</b><span>Example figure only</span><div className="rm-bars">{[42,64,49,72,55,86,63].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></div><div className="rm-report-card"><b>Recent sample transactions</b>{[{t:"09:42 AM",n:"Peak Milk 400g",a:9000},{t:"09:18 AM",n:"Rice 1kg × 2",a:4400},{t:"08:56 AM",n:"Mixed groceries",a:6700}].map((s,i)=><div className="rm-transaction" key={i}><span>✓</span><div><b>{s.n}</b><small>DEMO-104{i+6} · {s.t}</small></div><strong>{money(s.a)}</strong></div>)}</div></div>}
            </div>
          </div>
          <div className="rm-disclaimer">ⓘ &nbsp; This demo is self-contained. It does not connect to a shop database, accept payments, or update live inventory.</div>
        </div>
      </div></section>

      <section className="rm-setup rm-shell"><div><span className="rm-eyebrow">NOT JUST SOFTWARE</span><h2>We help you get<br /><em>set up properly.</em></h2><p>A retail system works best when products, workflow, equipment, and people are ready. Plan the setup around your business instead of figuring everything out alone.</p><a className="rm-button rm-dark-button" href="#rm-enquiry">Plan my shop setup <b>↗</b></a></div><div className="rm-setup-list">{[["01","Business setup","Discuss your shop type, checkout routine, and equipment requirements."],["02","Product and stock setup","Plan your catalogue, opening quantities, and stock checks."],["03","Staff training","Help your team practise daily tasks and common workflows."],["04","Backup and support planning","Review backup routines and recovery steps before launch."]].map(row=><div key={row[0]}><b>{row[0]}</b><span><strong>{row[1]}</strong><small>{row[2]}</small></span><i>↗</i></div>)}</div></section>

      {cmsContent?.contact?.visible !== false && (
        <section className="rm-enquiry-section" id="rm-enquiry"><div className="rm-shell rm-enquiry-layout"><div><span className="rm-eyebrow">{cmsContent?.contact?.eyebrow || "LET'S TALK ABOUT YOUR SHOP"}</span><h2>{cmsContent?.contact?.heading || <>Make your next<br /><em>shop upgrade count.</em></>}</h2><p>{cmsContent?.contact?.description || "Tell us about your shop and what you need. Submit the form to open WhatsApp with your enquiry ready to send."}</p><div className="rm-enquiry-note"><b>✳</b><span><strong>Built around your business</strong><small>Installation, setup, training, and licensing options will be confirmed with you directly.</small></span></div></div><form className="rm-form" onSubmit={submitEnquiry}><label>Your name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Ada" /></label><label>Business name<input value={form.business} onChange={e=>setForm({...form,business:e.target.value})} placeholder="Name of your shop" /></label><label>Phone or WhatsApp<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Your contact number" /></label><label>What do you need?<select value={form.need} onChange={e=>setForm({...form,need:e.target.value})}><option>POS and inventory setup</option><option>Software demonstration</option><option>Product and stock migration</option><option>Staff training</option><option>Licensing and support</option></select></label><button className="rm-button rm-primary" type="submit">{cmsContent?.contact?.buttonLabel || "Continue on WhatsApp"} <b>→</b></button><small className="rm-form-disclaimer">WhatsApp opens with your message ready. You must tap Send to submit your enquiry.</small></form></div></section>
      )}
    </main>
    <Footer />
  </div>;
}
