import Reveal from "./Reveal";

/**
 * Full-width "one line at a time" cinematic band. Used between sections on
 * the homepage, and reused on the Founder/TADCircle pages for pull quotes.
 */
export default function Statement({
  data,
}: {
  data: { kicker: string; line1: string; highlight: string; line2: string };
}) {
  return (
    <section className="statement">
      <div className="container">
        <Reveal>
          <span className="eyebrow statement-kicker">{data.kicker}</span>
          <h2>
            {data.line1} <span className="gold">{data.highlight}</span>
            <span className="dim">{data.line2}</span>
          </h2>
        </Reveal>
      </div>
    </section>
  );
}
