export default function LoadingEvent() {
  return (
    <div className="min-h-screen bg-cute text-cute-ink flex items-center justify-center px-5">
      <div className="card-cute w-full max-w-md flex items-center justify-center py-10">
        <img
          className="mona-day cute-float"
          src="https://github.githubassets.com/images/mona-loading-default.gif"
          alt="Loading"
          width={170}
          height={170}
        />
        <img
          className="mona-night cute-float"
          src="https://github.githubassets.com/images/mona-loading-dark.gif"
          alt="Loading"
          width={170}
          height={170}
        />
      </div>
    </div>
  );
}
