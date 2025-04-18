import React from 'react';

const Loader = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="loader-container">
        <style jsx>{`
          .loader-container {
            --uib-size: 35px;
            --uib-speed: 0.8s;
            --uib-color: #28a53f;
            position: relative;
            display: inline-block;
            height: var(--uib-size);
            width: var(--uib-size);
            animation: spin calc(var(--uib-speed) * 2.5) infinite linear;
          }

          .dot {
            position: absolute;
            height: 100%;
            width: 30%;
          }

          .dot::after {
            content: '';
            position: absolute;
            height: 0%;
            width: 100%;
            padding-bottom: 100%;
            background-color: var(--uib-color);
            border-radius: 50%;
          }

          .dot:nth-child(1) {
            bottom: 5%;
            left: 0;
            transform: rotate(60deg);
            transform-origin: 50% 85%;
          }

          .dot:nth-child(1)::after {
            bottom: 0;
            left: 0;
            animation: wobble1 var(--uib-speed) infinite ease-in-out;
            animation-delay: calc(var(--uib-speed) * -0.3);
          }

          .dot:nth-child(2) {
            bottom: 5%;
            right: 0;
            transform: rotate(-60deg);
            transform-origin: 50% 85%;
          }

          .dot:nth-child(2)::after {
            bottom: 0;
            left: 0;
            animation: wobble1 var(--uib-speed) infinite calc(var(--uib-speed) * -0.15) ease-in-out;
          }

          .dot:nth-child(3) {
            bottom: -5%;
            left: 0;
            transform: translateX(116.666%);
          }

          .dot:nth-child(3)::after {
            top: 0;
            left: 0;
            animation: wobble2 var(--uib-speed) infinite ease-in-out;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }

            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes wobble1 {
            0%,
            100% {
              transform: translateY(0%) scale(1);
              opacity: 1;
            }

            50% {
              transform: translateY(-66%) scale(0.65);
              opacity: 0.8;
            }
          }

          @keyframes wobble2 {
            0%,
            100% {
              transform: translateY(0%) scale(1);
              opacity: 1;
            }

            50% {
              transform: translateY(66%) scale(0.65);
              opacity: 0.8;
            }
          }
        `}</style>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  );
}

export default Loader; 