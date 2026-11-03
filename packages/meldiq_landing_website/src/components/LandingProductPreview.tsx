/** Non-interactive, labelled illustrations. No chat or account connection. */
export function LandingProductPreview({ view = "community" }: { view?: "community" | "discover" | "messages" }) {
  const community = view === "community";
  return (
    <figure className={`ref-product ref-product-${view}`}>
      <div className="ref-client" role="img" aria-label={`Illustrative Meldiq ${view} preview with sample content`}>
        <div className="ref-client-top">
          <span className="ref-window-dots">
            <i />
            <i />
            <i />
          </span>
          <span>Meldiq</span>
          <span>− &nbsp; □ &nbsp; ×</span>
        </div>
        <div className="ref-client-body">
          <aside className="ref-server-rail">
            <img src="/meldling-128.png" alt="" width={34} height={34} />
            <span className="ref-server-current">M</span>
            <span>S</span>
            <span>+</span>
          </aside>
          <aside className="ref-client-sidebar">
            <strong>
              {community ? "Meldiq Community" : "Direct messages"}
              <span>⌄</span>
            </strong>
            {community ? (
              <>
                <small>COMMUNITY</small>
                <span className="selected"># &nbsp; general</span>
                <span># &nbsp; announcements</span>
                <span># &nbsp; share-your-work</span>
                <span>▤ &nbsp; discussions</span>
                <small>VOICE CHANNELS</small>
                <span>◖ &nbsp; Lounge</span>
                <span>◖ &nbsp; Gaming</span>
              </>
            ) : (
              <>
                <span>◉ &nbsp; Friends</span>
                <span className={view === "discover" ? "selected" : ""}>⌕ &nbsp; Discover</span>
                <span>＋ &nbsp; New message</span>
                <small>CONVERSATIONS</small>
                <span className={view === "messages" ? "selected" : ""}>
                  <i className="ref-avatar">S</i> Sam
                </span>
                <span>
                  <i className="ref-avatar alt">W</i> Weekend plans
                </span>
                <span>
                  <i className="ref-avatar muted-avatar">A</i> Alex
                </span>
              </>
            )}
            <div className="ref-client-user">
              <i className="ref-avatar">Y</i>
              <span>
                You<small>Online</small>
              </span>
              <span>⚙</span>
            </div>
          </aside>
          <div className="ref-client-main">
            {view === "discover" ? (
              <>
                <div className="ref-client-toolbar">Discover communities</div>
                <div className="ref-discovery">
                  <h3>Find your community.</h3>
                  <p>A place for the things you share.</p>
                  <div className="ref-search-illustration">⌕ &nbsp; Search communities</div>
                  <div className="ref-discover-card">
                    <div className="ref-discover-banner">
                      <img src="/meldling-128.png" width={50} height={50} alt="" />
                      <span>meldiq.</span>
                    </div>
                    <h4>Meldiq Community</h4>
                    <p>Conversations, ideas and a place to say hello.</p>
                    <span className="ref-preview-label">Example community</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="ref-client-toolbar">
                  {community ? "#  general" : "Sam"}
                  <span>♧ ◖ ⌕</span>
                </div>
                <div className="ref-conversation">
                  <div className="ref-conversation-intro">
                    <span>{community ? "#" : "S"}</span>
                    <h3>{community ? "Welcome to #general" : "Your conversation with Sam"}</h3>
                    <p>{community ? "A place for your community to talk." : "A private place to keep in touch."}</p>
                  </div>
                  <div className="ref-example-date">EXAMPLE CONVERSATION</div>
                  <div className="ref-example-message">
                    <i className="ref-avatar">S</i>
                    <div>
                      <strong>
                        Sam <small>Today</small>
                      </strong>
                      <p>{community ? "Hey everyone! What are you working on today?" : "Are we still on for this weekend?"}</p>
                    </div>
                  </div>
                  <div className="ref-example-message">
                    <i className="ref-avatar alt">Y</i>
                    <div>
                      <strong>
                        You <small>Today</small>
                      </strong>
                      <p>{community ? "A new idea. I’ll share it here when it’s ready." : "Absolutely. Let’s get the group together."}</p>
                      <span className="ref-message-reaction">👍 &nbsp; 1</span>
                    </div>
                  </div>
                </div>
                <div className="ref-message-field">
                  ＋ &nbsp; {community ? "Message #general" : "Message Sam"}
                  <span>☺</span>
                </div>
              </>
            )}
          </div>
          {community ? (
            <aside className="ref-client-members">
              <small>MEMBERS</small>
              <span>
                <i className="ref-avatar">S</i> Sam
              </span>
              <span>
                <i className="ref-avatar alt">Y</i> You
              </span>
              <span>
                <i className="ref-avatar muted-avatar">A</i> Alex
              </span>
            </aside>
          ) : null}
        </div>
      </div>
      <figcaption>Illustrative Meldiq preview · Sample content</figcaption>
    </figure>
  );
}
