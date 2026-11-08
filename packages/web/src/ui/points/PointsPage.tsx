import { Award, Flame, History, Map } from "lucide-react";
import { useState } from "react";
import { useEngine, useOrbit } from "../../application/orbit";
import { points as loadPoints } from "../../sync/points";
import { EmberIcon } from "../components/EmberIcon";
import { LevelRing } from "../people/LevelRing";
import { useLoad } from "../workspace/useLoad";
import { AchievementGallery } from "./AchievementGallery";
import { PointsEarn } from "./PointsEarn";
import { PointsQuests } from "./PointsQuests";
import { levelProgress } from "./pointsWords";

/** The internal points API stays compatible; the earned currency people see is Embers. */
export function PointsPage() {
  const engine = useEngine();
  const offered = useOrbit((s) => s.server?.features.includes("points") ?? false);
  const profilesRev = useOrbit((s) => s.profilesRev);
  const data = useLoad(() => (offered ? loadPoints(engine) : Promise.resolve(null)), [engine, offered, profilesRev]);
  const [tab, setTab] = useState<"quests" | "achievements" | "activity">("quests");
  const p = data.data;
  return (
    <div className="points embers-page">
      <header className="embers-heading">
        <span className="embers-brand">
          <EmberIcon size={42} />
        </span>
        <div>
          <span className="ember-eyebrow">YOUR MELDIQ JOURNEY</span>
          <h1>Embers</h1>
          <p>Show up. Find your people. Keep the glow going.</p>
        </div>
      </header>
      {!offered && <p className="muted">Embers aren't available on this server yet.</p>}
      {data.error && (
        <div className="banner danger" role="alert">
          {data.error}
          <button className="btn btn-secondary btn-sm" onClick={data.reload}>
            Try again
          </button>
        </div>
      )}
      {offered && !p && !data.error && <div className="skeleton" style={{ height: 180 }} aria-busy="true" />}
      {p && (
        <>
          {!p.earning && (
            <div className="banner" role="status">
              Your campfire is just getting started. Earning opens after your account's first day.
            </div>
          )}
          <div className="embers-overview">
            <section className="embers-wallet" aria-label="Embers balance">
              <div>
                <span className="ember-eyebrow">YOUR EMBERS</span>
                <strong>{p.balance.toLocaleString()}</strong>
                <p>A little warmth, earned together.</p>
              </div>
              <EmberIcon size={82} />
              <div className="embers-wallet-stats">
                <span>
                  <b>+{p.earnedToday.toLocaleString()}</b> today
                </span>
                <span>
                  <b>{p.earnedTotal.toLocaleString()}</b> lifetime
                </span>
                <span>
                  <Flame size={13} />
                  <b>{p.streak}</b> day streak
                </span>
              </div>
            </section>
            <section className="embers-level" aria-label="Account level">
              <LevelRing level={p.level} size={68} progress={levelProgress(p.balance, p.nextLevelCost)} />
              <div aria-live="polite">
                <span className="ember-eyebrow">YOUR NEXT CHAPTER</span>
                <h2>Level {p.level}</h2>
                <p>
                  {Math.max(0, p.nextLevelCost - p.balance).toLocaleString()} Embers to level {p.level + 1}
                </p>
                <p>Your account levels up automatically when you earn enough Embers.</p>
              </div>
            </section>
          </div>
          <div className="embers-tabs" role="tablist" aria-label="Embers sections">
            {(
              [
                { key: "quests", label: "Quests", icon: Map },
                { key: "achievements", label: "Achievements", icon: Award },
                { key: "activity", label: "Activity", icon: History },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button key={key} role="tab" id={`ember-tab-${key}`} aria-selected={tab === key} aria-controls={`ember-panel-${key}`} onClick={() => setTab(key)}>
                <Icon size={16} />
                {label}
                {key === "achievements" && <span>{p.achievements.filter((a) => a.earnedAt !== null).length}</span>}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`ember-panel-${tab}`} aria-labelledby={`ember-tab-${tab}`} className="embers-content">
            {tab === "quests" && (
              <>
                <PointsQuests quests={p.quests} resetsAt={p.resetsAt} />
                <PointsEarn points={p} mode="ways" />
              </>
            )}
            {tab === "achievements" && <AchievementGallery achievements={p.achievements} />}
            {tab === "activity" && <PointsEarn points={p} mode="history" />}
          </div>
          <p className="embers-footnote">Embers are earned through participation. They can’t be bought, sold, or transferred. Badges celebrate real milestones.</p>
        </>
      )}
    </div>
  );
}
