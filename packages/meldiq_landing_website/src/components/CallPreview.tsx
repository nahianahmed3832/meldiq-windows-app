export function CallPreview() {
  return (
    <figure className="call-preview">
      <div role="img" aria-label="Illustrative Meldiq voice room with three sample participants">
        <div className="call-preview-top">
          <span className="call-signal" aria-hidden="true">
            ▂▄▆
          </span>{" "}
          The lounge <span className="call-preview-label">VOICE ROOM</span>
        </div>
        <div className="call-preview-people">
          {[
            ["S", "Sam"],
            ["Y", "You"],
            ["A", "Alex"],
          ].map(([letter, name], i) => (
            <div key={name} className={i === 1 ? "is-speaking" : ""}>
              <span>{letter}</span>
              <strong>{name}</strong>
              <small>{i === 1 ? "Speaking" : "Listening"}</small>
            </div>
          ))}
        </div>
        <div className="call-preview-screen">
          <span aria-hidden="true">▣</span>
          <div>
            <strong>Bring everyone along.</strong>
            <p>A project, a game, a little of your day.</p>
          </div>
        </div>
        <div className="call-preview-controls" aria-hidden="true">
          <span>♩</span>
          <span>▣</span>
          <span>▤</span>
          <span>⌁</span>
        </div>
      </div>
      <figcaption>Illustrative voice room · Sample participants</figcaption>
    </figure>
  );
}
