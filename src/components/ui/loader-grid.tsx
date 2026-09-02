import React from "react";

export function LoaderGrid({ className }: { className?: string }) {
  return (
    <>
      <style>{`
        .loader-grid-container {
          position: relative;
          width: 2.5em;
          height: 2.5em;
          transform: rotate(165deg);
        }

        .loader-grid-before, .loader-grid-after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          display: block;
          width: 0.5em;
          height: 0.5em;
          border-radius: 0.25em;
          transform: translate(-50%, -50%);
        }

        .loader-grid-before {
          animation: before8 2s infinite;
        }

        .loader-grid-after {
          animation: after6 2s infinite;
        }

        @keyframes before8 {
          0% {
            width: 0.5em;
            box-shadow: 1em -0.5em rgba(225, 20, 98, 0.75), -1em 0.5em rgba(111, 202, 220, 0.75);
          }
          35% {
            width: 2.5em;
            box-shadow: 0 -0.5em rgba(225, 20, 98, 0.75), 0 0.5em rgba(111, 202, 220, 0.75);
          }
          70% {
            width: 0.5em;
            box-shadow: -1em -0.5em rgba(225, 20, 98, 0.75), 1em 0.5em rgba(111, 202, 220, 0.75);
          }
          100% {
            box-shadow: 1em -0.5em rgba(225, 20, 98, 0.75), -1em 0.5em rgba(111, 202, 220, 0.75);
          }
        }

        @keyframes after6 {
          0% {
            height: 0.5em;
            box-shadow: 0.5em 1em rgba(61, 184, 143, 0.75), -0.5em -1em rgba(233, 169, 32, 0.75);
          }
          35% {
            height: 2.5em;
            box-shadow: 0.5em 0 rgba(61, 184, 143, 0.75), -0.5em 0 rgba(233, 169, 32, 0.75);
          }
          70% {
            height: 0.5em;
            box-shadow: 0.5em -1em rgba(61, 184, 143, 0.75), -0.5em 1em rgba(233, 169, 32, 0.75);
          }
          100% {
            box-shadow: 0.5em 1em rgba(61, 184, 143, 0.75), -0.5em -1em rgba(233, 169, 32, 0.75);
          }
        }
      `}</style>
      <div className={`loader-grid-container text-[12px] ${className || ""}`}>
        <span className="loader-grid-before" />
        <span className="loader-grid-after" />
      </div>
    </>
  );
}
