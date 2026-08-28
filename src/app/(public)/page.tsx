import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { productConfig } from "@/config/product";

export default function LandingPage() {
  return (
    <main id="main-content">
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">Early detection and ongoing awareness</p>
            <h1>Build a clearer view of your cardiometabolic health information.</h1>
            <p className="lede">
              {productConfig.productName} is being designed to help people collect,
              understand, and follow approved health information over time.
            </p>
            <div className="hero__actions">
              <ButtonLink href="/sign-up">Create an account</ButtonLink>
              <ButtonLink href="/sign-in" variant="secondary">
                Sign in
              </ButtonLink>
            </div>
          </div>
          <Card>
            <p className="eyebrow">Foundation preview</p>
            <h2>A guided, progressive experience</h2>
            <p>
              Account access, consent, setup, data entry, history, trends, and
              summary surfaces are represented as non-clinical UI shells.
            </p>
          </Card>
        </div>
      </section>
      <section className="section" aria-labelledby="foundation-heading">
        <div className="container">
          <h2 id="foundation-heading">Designed around clarity and provenance</h2>
          <div className="feature-grid">
            <Card>
              <h3>Progressive setup</h3>
              <p>Collect only approved information at the appropriate step.</p>
            </Card>
            <Card>
              <h3>Traceable information</h3>
              <p>Show where data came from without implying clinical validity.</p>
            </Card>
            <Card>
              <h3>Accessible by default</h3>
              <p>Semantic structure, keyboard focus, readable contrast, and responsive layouts.</p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
