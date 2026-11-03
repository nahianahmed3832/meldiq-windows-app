export function FinalCta() {
  return (
    <>
      <section className={"final-cta wrap"}>
        <span className={"tiny-star star-one"}>{"✦"}</span>
        <span className={"eyebrow"}>{"GOOD CONVERSATIONS START SOMEWHERE"}</span>
        <h2>
          {"Your next community"}
          <br />
          {"starts "}
          <em>{"here."}</em>
        </h2>
        <p>
          {"Create a free account, invite your friends,"}
          <br />
          {"and bring your conversations together."}
        </p>
        <div className={"button-row"}>
          <a className={"button primary"} href={"/signup"}>
            {"Create a Free Account"}
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 12h14M13 6l6 6-6 6"}></path>
            </svg>
          </a>
          <a className={"button ghost"} href={"/features"}>
            {"Explore Meldiq"}
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 12h14M13 6l6 6-6 6"}></path>
            </svg>
          </a>
        </div>
        <span className={"tiny-star star-two"}>{"✳"}</span>
      </section>
    </>
  );
}
export function ProductPreview() {
  return (
    <>
      <figure className={"product-figure"}>
        <div className={"app-window"}>
          <div className={"window-top"}>
            <span className={"window-dots"}>
              <i></i>
              <i></i>
              <i></i>
            </span>
            <span>{"YOUR LITTLE CORNER OF THE INTERNET"}</span>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <rect x={"5"} y={"10"} width={14} height={11} rx={"3"}></rect>
              <path d={"M8 10V7a4 4 0 0 1 8 0v3"}></path>
            </svg>
          </div>
          <div className={"app-layout"}>
            <div className={"server-rail"}>
              <img className={""} src={"/assets/meldling-128.png"} width={31} height={31} alt={""} loading={"lazy"} decoding={"async"} />
              <span className={"server active"}>{"✷"}</span>
              <span className={"server peach"}>{"☄"}</span>
              <span className={"server mint"}>{"✿"}</span>
              <span className={"server add"}>{"+"}</span>
            </div>
            <div className={"channel-sidebar"}>
              <div className={"community-name"}>
                {"The after hours club "}
                <span>{"⌄"}</span>
              </div>
              <span className={"channel-category"}>{"⌄ THE HANGOUT"}</span>
              <div className={"channel active"}>
                {"# "}
                <span>{"general"}</span>
                <b>{"3"}</b>
              </div>
              <div className={"channel"}>
                {"# "}
                <span>{"introductions"}</span>
              </div>
              <div className={"channel"}>
                {"# "}
                <span>{"the-good-stuff"}</span>
              </div>
              <span className={"channel-category"}>{"⌄ COME HANG"}</span>
              <div className={"channel"}>
                <svg
                  className={"icon"}
                  width={24}
                  height={24}
                  viewBox={"0 0 24 24"}
                  fill={"none"}
                  stroke={"currentColor"}
                  strokeWidth={"1.7"}
                  strokeLinecap={"round"}
                  strokeLinejoin={"round"}
                  aria-hidden={"true"}
                >
                  <path d={"M5 9v6M9 5v14M13 2v20M17 7v10M21 10v4"}></path>
                </svg>
                <span>{"the living room"}</span>
              </div>
              <div className={"mini-members"}>
                <span className={"avatar peach"} aria-hidden={"true"}>
                  {"J"}
                </span>
                <span className={"avatar mint"} aria-hidden={"true"}>
                  {"K"}
                </span>
                <span className={"avatar purple"} aria-hidden={"true"}>
                  {"M"}
                </span>
              </div>
              <div className={"voice-connected"}>
                <span className={"status-dot"}></span>
                {" Voice connected"}
                <small>{"The living room"}</small>
              </div>
            </div>
            <div className={"chat-preview"}>
              <div className={"chat-heading"}>
                {"# "}
                <strong>{"general"}</strong>
                <span>
                  <svg
                    className={"icon"}
                    width={24}
                    height={24}
                    viewBox={"0 0 24 24"}
                    fill={"none"}
                    stroke={"currentColor"}
                    strokeWidth={"1.7"}
                    strokeLinecap={"round"}
                    strokeLinejoin={"round"}
                    aria-hidden={"true"}
                  >
                    <circle cx={"9"} cy={"8"} r={"4"}></circle>
                    <path d={"M2 21v-3a7 7 0 0 1 14 0v3M17 4a4 4 0 0 1 0 8M22 21v-3a6 6 0 0 0-4-6"}></path>
                  </svg>
                </span>
              </div>
              <div className={"chat-body"}>
                <span className={"chat-date"}>{"THE START OF SOMETHING GOOD"}</span>
                <div className={"sample-message"}>
                  <span className={"avatar peach"} aria-hidden={"true"}>
                    {"J"}
                  </span>
                  <div>
                    <strong>
                      {"jules "}
                      <small>{"19:42"}</small>
                    </strong>
                    <p>{"Same time, same chaos tonight? 👀"}</p>
                  </div>
                </div>
                <div className={"sample-message"}>
                  <span className={"avatar mint"} aria-hidden={"true"}>
                    {"K"}
                  </span>
                  <div>
                    <strong>
                      {"kai "}
                      <small>{"19:43"}</small>
                    </strong>
                    <p>{"Already in the living room. Bring snacks."}</p>
                    <div className={"reaction"}>{"✨ 3"}</div>
                  </div>
                </div>
                <div className={"sample-message"}>
                  <span className={"avatar purple"} aria-hidden={"true"}>
                    {"M"}
                  </span>
                  <div>
                    <strong>
                      {"mika "}
                      <small>{"19:44"}</small>
                    </strong>
                    <p>{"Found my people 💜"}</p>
                    <div className={"shared-art"}>
                      <span>
                        {"AFTER"}
                        <br />
                        {"HOURS"}
                        <span>{"PLAY • CREATE • JUST BE"}</span>
                      </span>
                      <i>{"✷"}</i>
                    </div>
                  </div>
                </div>
              </div>
              <div className={"mock-composer"}>
                <span>{"＋"}</span>
                {" A place to say your thing. "}
                <span>{"☺"}</span>
              </div>
            </div>
          </div>
        </div>
        <figcaption>{"Illustrative product preview · Example community and messages"}</figcaption>
      </figure>
    </>
  );
}
export function PrivacyStory() {
  return (
    <>
      <section className={"privacy-section wrap"} id={"privacy"}>
        <div className={"privacy-visual"}>
          <div className={"orbit orbit-a"}></div>
          <div className={"orbit orbit-b"}></div>
          <span className={"floating-label privacy-tag"}>{"Encrypted on your device"}</span>
          <div className={"lock-core"}>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <rect x={"5"} y={"10"} width={14} height={11} rx={"3"}></rect>
              <path d={"M8 10V7a4 4 0 0 1 8 0v3"}></path>
            </svg>
          </div>
          <span className={"cipher"}>{"a8f2 • 9c4e • 7b1d"}</span>
          <span className={"privacy-mini"}>{"YOUR WORDS. YOUR PEOPLE."}</span>
        </div>
        <div className={"privacy-copy"}>
          <span className={"eyebrow"}>{"A LITTLE PRIVACY. A LOT OF PEACE OF MIND."}</span>
          <h2>
            {"Your private conversations"}
            <br />
            {"should stay "}
            <em>{"private."}</em>
          </h2>
          <p>{"Messages and attachments are encrypted on your devices before they’re sent. Your private keys stay with you."}</p>
          <div className={"privacy-points"}>
            <span>
              <svg
                className={"icon"}
                width={24}
                height={24}
                viewBox={"0 0 24 24"}
                fill={"none"}
                stroke={"currentColor"}
                strokeWidth={"1.7"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
                aria-hidden={"true"}
              >
                <path d={"m5 12 4 4L19 6"}></path>
              </svg>
              {" Messages & attachments"}
            </span>
            <span>
              <svg
                className={"icon"}
                width={24}
                height={24}
                viewBox={"0 0 24 24"}
                fill={"none"}
                stroke={"currentColor"}
                strokeWidth={"1.7"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
                aria-hidden={"true"}
              >
                <path d={"m5 12 4 4L19 6"}></path>
              </svg>
              {" Call media, with encryption on"}
            </span>
          </div>
          <p className={"fine-print"}>
            {
              "Encryption protects the content, not all metadata. Account details, memberships and message routing information remain visible to the server. No independent security audit has been completed."
            }
          </p>
          <a className={"button text-link"} href={"/legal/privacy"}>
            {"Explore our privacy approach"}
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 12h14M13 6l6 6-6 6"}></path>
            </svg>
          </a>
        </div>
      </section>
    </>
  );
}
export function VoicePreview() {
  return (
    <>
      <div className={"voice-visual"}>
        <span className={"voice-room"}>
          <svg
            className={"icon"}
            width={24}
            height={24}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            strokeWidth={"1.7"}
            strokeLinecap={"round"}
            strokeLinejoin={"round"}
            aria-hidden={"true"}
          >
            <path d={"M5 9v6M9 5v14M13 2v20M17 7v10M21 10v4"}></path>
          </svg>
          {" the living room "}
          <span className={"live-pill"}>{"HANGING OUT"}</span>
        </span>
        <div className={"call-people"}>
          <div className={"call-person"}>
            <span className={"avatar peach"} aria-hidden={"true"}>
              {"J"}
            </span>
            <span>{"jules"}</span>
          </div>
          <div className={"call-person speaking"}>
            <span className={"avatar mint"} aria-hidden={"true"}>
              {"K"}
            </span>
            <span>
              {"kai "}
              <i>{"▂▅▃▆"}</i>
            </span>
          </div>
          <div className={"call-person"}>
            <span className={"avatar purple"} aria-hidden={"true"}>
              {"M"}
            </span>
            <span>{"mika"}</span>
          </div>
        </div>
        <div className={"call-controls"}>
          <span>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 9v6M9 5v14M13 2v20M17 7v10M21 10v4"}></path>
            </svg>
          </span>
          <span>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <rect x={"3"} y={"5"} width={13} height={14} rx={"3"}></rect>
              <path d={"m16 10 5-3v10l-5-3"}></path>
            </svg>
          </span>
          <span>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <rect x={"2"} y={"3"} width={20} height={14} rx={"3"}></rect>
              <path d={"M8 21h8M12 17v4m-4-11 4-4 4 4M12 6v7"}></path>
            </svg>
          </span>
          <span className={"hang-up"}>{"⌁"}</span>
        </div>
        <p>{"Illustrative voice-room preview"}</p>
      </div>
    </>
  );
}
