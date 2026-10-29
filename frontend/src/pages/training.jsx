import Header from "../components/Header";
import Footer from "../components/footer";
import "./training.css";

const whatsapp = "https://wa.me/2347013415235";

const programmes = [
  {
    number: "01",
    title: "Video Production & Editing",
    price: "₦100,000",
    period: "per month",
    description:
      "Build practical skills for producing and editing videos for businesses, brands and social media.",
    topics: [
      "Video planning and shot preparation",
      "Camera and smartphone production techniques",
      "Hands-on video editing and storytelling",
      "Exporting and preparing content for publication",
    ],
    message:
      "Hello Creator Yard, I am interested in the one-month Video Production and Editing Training programme priced at ₦100,000.",
    featured: false,
  },
  {
    number: "02",
    title: "Retail Software Setup",
    price: "₦5,000",
    period: "training offer",
    description:
      "Learn the practical workflow for installing and setting up the Creator Yard retail management project.",
    topics: [
      "Introduction to the retail management system",
      "Guided installation and configuration",
      "Understanding the GitHub project workflow",
      "Hands-on walkthrough of the POS and inventory features",
    ],
    message:
      "Hello Creator Yard, I would like to enquire about the ₦5,000 Retail Management Setup Training. Please confirm the session duration and requirements.",
    featured: false,
  },
  {
    number: "03",
    title: "Combined Practical Programme",
    price: "₦120,000",
    period: "full month",
    description:
      "Combine video production and editing training with practical retail software installation and setup.",
    topics: [
      "The video production and editing learning track",
      "The retail management installation learning track",
      "Guided practical exercises across both tracks",
      "A structured one-month learning plan",
    ],
    message:
      "Hello Creator Yard, I am interested in the combined one-month Video Production, Editing and Retail Management Training programme for ₦120,000.",
    featured: true,
  },
];

function Training() {
  return (
    <>
      <Header />
      <main className="cy-training">
        <section className="cy-training-hero">
          <div className="cy-training-hero-inner">
            <span className="cy-training-eyebrow">
              CREATOR YARD · PRACTICAL DIGITAL SKILLS
            </span>
            <h1>
              Learn the skill.
              <br />
              <span>Build something real.</span>
            </h1>
            <p>
              Hands-on training in video production, editing and retail
              software setup. Learn by doing, with guided practical work
              designed around real tools and workflows.
            </p>
            <div className="cy-training-actions">
              <a className="cy-training-button cy-training-primary" href="#programmes">
                Explore programmes <span>↓</span>
              </a>
              <a
                className="cy-training-button cy-training-secondary"
                href={`${whatsapp}?text=${encodeURIComponent("Hello Creator Yard, I would like to discuss your practical training programmes.")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ask a question <span>↗</span>
              </a>
            </div>
            <div className="cy-training-note">
              Practical sessions · Guided learning · Real-world workflows
            </div>
          </div>
        </section>

        <section className="cy-training-intro">
          <span className="cy-training-kicker">LEARN THROUGH PRACTICE</span>
          <h2>
            Less theory for theory’s sake.
            <br />
            <span>More doing.</span>
          </h2>
          <p>
            Whether you want to create better videos or understand how retail
            software is installed and configured, our programmes focus on
            guided practice. Contact us before enrolling to confirm the
            schedule, prerequisites and available training arrangements.
          </p>
        </section>

        <section className="cy-training-programmes" id="programmes">
          <div className="cy-training-section-heading">
            <div>
              <span className="cy-training-kicker">CHOOSE YOUR TRACK</span>
              <h2>Three ways to get started.</h2>
            </div>
            <p>
              Choose one skill area or combine both in the one-month programme.
            </p>
          </div>

          <div className="cy-training-grid">
            {programmes.map((programme) => (
              <article
                className={`cy-training-card${programme.featured ? " cy-training-card-featured" : ""}`}
                key={programme.number}
              >
                <div className="cy-training-card-top">
                  <span>{programme.number} / PROGRAMME</span>
                  {programme.featured && <span className="cy-training-badge">COMBINED</span>}
                </div>
                <h3>{programme.title}</h3>
                <div className="cy-training-price">
                  {programme.price}
                  <span>{programme.period}</span>
                </div>
                <p className="cy-training-description">{programme.description}</p>
                <div className="cy-training-includes">WHAT YOU WILL WORK ON</div>
                <ul>
                  {programme.topics.map((topic) => (
                    <li key={topic}>
                      <span aria-hidden="true">↗</span>
                      {topic}
                    </li>
                  ))}
                </ul>
                <a
                  className={`cy-training-enrol${programme.featured ? " cy-training-enrol-featured" : ""}`}
                  href={`${whatsapp}?text=${encodeURIComponent(programme.message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Enquire on WhatsApp <span>↗</span>
                </a>
              </article>
            ))}
          </div>
          <p className="cy-training-pricing-note">
            The ₦120,000 combined option is the stated price for the full
            one-month programme. The ₦5,000 retail setup offer requires
            confirmation of session duration and scope before enrolment.
          </p>
        </section>

        <section className="cy-training-process">
          <span className="cy-training-kicker">HOW TO GET STARTED</span>
          <h2>A clear path from enquiry to practice.</h2>
          <div className="cy-training-steps">
            <article>
              <span>01</span>
              <h3>Choose your programme</h3>
              <p>Decide which skills you want to learn and what you want to achieve.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Confirm the details</h3>
              <p>Ask us about dates, training format, prerequisites and what to bring.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Learn by doing</h3>
              <p>Work through guided exercises and practise the tools and workflows.</p>
            </article>
          </div>
        </section>

        <section className="cy-training-cta">
          <span className="cy-training-kicker">READY TO BEGIN?</span>
          <h2>
            Your next skill
            <br />
            <span>starts with a conversation.</span>
          </h2>
          <p>Tell us which programme interests you and we’ll help you understand the next steps.</p>
          <a
            className="cy-training-button cy-training-primary"
            href={`${whatsapp}?text=${encodeURIComponent("Hello Creator Yard, please help me choose a practical training programme.")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Talk to Creator Yard <span>↗</span>
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Training;
