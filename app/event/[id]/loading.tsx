export default function LoadingEvent() {
  return (
    <div className="min-h-screen bg-cute text-cute-ink flex items-center justify-center px-5">
      <div className="card-cute w-full max-w-md text-center">
        <img
          src="https://github.githubassets.com/images/mona-loading-default.gif"
          alt="Loading"
          width={160}
          height={160}
          className="mx-auto"
        />
        <p className="text-sm text-cute-muted mt-2">Loading event… zZz</p>

        <div className="mt-4 space-y-2">
          <div className="h-10 rounded-2xl bg-white/35" />
          <div className="h-10 rounded-2xl bg-white/28" />
          <div className="h-10 rounded-2xl bg-white/22" />
        </div>
      </div>
    </div>
  );
}
