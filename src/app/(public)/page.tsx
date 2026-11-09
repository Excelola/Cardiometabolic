import { ButtonLink } from "@/components/ui/button-link";
import { MediaFrame } from "@/components/ui/media-frame";
import { productConfig } from "@/config/product";

export default function LandingPage() {
  return (
    <main id="main-content">
      <section className="hero" id="how-it-works">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">Your health journal</p>
            <h1>Understand your <em>health information</em></h1>
            <p className="lede">
              Keep track of your measurements, see how they change over time, and learn
              what HILERA can help you do next.
            </p>
            <div className="hero__actions">
              <ButtonLink href="/sign-up">Create account</ButtonLink>
              <ButtonLink href="/sign-in" variant="secondary">
                Sign in
              </ButtonLink>
            </div>
            <p className="hero__boundary muted">
              {productConfig.productName} helps you understand health information, see
              changes over time, and know an appropriate next step without replacing
              professional healthcare.
            </p>
          </div>
          <MediaFrame ariaLabel="What you can do with HILERA" className="hero-media">
            <p className="eyebrow">How it works</p>
            <h2>Your health, over time</h2>
            <ul className="hero-media__list">
              <li><strong>Health information</strong><span>Keep important information together.</span></li>
              <li><strong>Review</strong><span>Look back at what you recorded.</span></li>
              <li><strong>Changes over time</strong><span>See supported information over time.</span></li>
              <li><strong>Next step</strong><span>Follow approved guidance when available.</span></li>
            </ul>
          </MediaFrame>
        </div>
      </section>
      <section className="trust-strip" id="why-hilera" aria-label="HILERA product principles">
        <div className="container trust-strip__grid">
          <div><strong>Privacy by design</strong><span>Your information is handled with care.</span></div>
          <div><strong>You stay in control</strong><span>Know what is collected and why.</span></div>
          <div id="learn"><strong>Clear explanations</strong><span>Health information in simpler words.</span></div>
          <div><strong>Clinically bounded</strong><span>No unsupported diagnosis or treatment.</span></div>
        </div>
      </section>
    </main>
  );
}
