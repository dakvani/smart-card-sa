/**
 * ScrollStoryFallback — instant first-paint placeholder shown while the
 * heavier ScrollStory motion module is initializing. Mirrors the visual
 * footprint of stage 1 so there's zero layout shift when the real
 * component mounts.
 */
export function ScrollStoryFallback() {
  return (
    <section
      className="relative h-screen w-full overflow-hidden bg-background"
      aria-label="Loading SmartLink story"
      aria-busy="true"
    >
      {/* Ambient orbs — match ScrollStory initial state */}
      <div
        aria-hidden
        className="absolute top-[8%] left-[-8%] w-[520px] h-[520px] rounded-full bg-primary/20 blur-[140px] -z-10"
      />
      <div
        aria-hidden
        className="absolute bottom-[6%] right-[-8%] w-[520px] h-[520px] rounded-full bg-accent/20 blur-[140px] -z-10"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/[0.03] to-background"
      />

      {/* Top progress bar placeholder */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 z-30" />

      <div className="relative h-full container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Copy column — matches StageCopy index 0 */}
        <div className="relative h-[60vh] md:h-[50vh] flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-primary mb-4">
            <span className="w-8 h-px bg-primary" />
            01 · Manufactured
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            A blank chip, waiting.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
            An NTAG21x microchip wired to a copper antenna coil. No battery. No app. Just a hard-coded UID and an empty EEPROM ready for your story.
          </p>
        </div>

        {/* Graphics column — static card silhouette */}
        <div className="relative h-[60vh] md:h-[60vh] flex items-center justify-center">
          <div className="relative w-full max-w-[460px] aspect-[1.6/1]">
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 blur-2xl opacity-30" />
            <div className="relative w-full h-full rounded-[28px] border border-primary/30 bg-card/40 backdrop-blur-xl shadow-2xl" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        <div className="h-1.5 w-8 rounded-full bg-primary" />
        <div className="h-1.5 w-2 rounded-full bg-primary/30" />
        <div className="h-1.5 w-2 rounded-full bg-primary/30" />
        <div className="h-1.5 w-2 rounded-full bg-primary/30" />
      </div>
    </section>
  );
}
