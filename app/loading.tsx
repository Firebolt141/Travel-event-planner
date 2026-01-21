export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-cute text-cute-ink flex items-center justify-center px-5">
      <div className="card-cute w-full max-w-md flex flex-col items-center justify-center py-10">
        <img
          className="mona-day cute-float"
          src="https://github.githubassets.com/images/mona-loading-default.gif"
          alt="Loading"
          width={190}
          height={190}
        />
        <img
          className="mona-night cute-float"
          src="https://github.githubassets.com/images/mona-loading-dark.gif"
          alt="Loading"
          width={190}
          height={190}
        />

        <p className="mt-4 text-sm font-semibold text-cute-muted">
          One tiny moment… <span className="font-extrabold">zZz</span>
        </p>
      </div>
    </div>
  );
}
