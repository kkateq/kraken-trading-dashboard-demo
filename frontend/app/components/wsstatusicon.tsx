import { ReadyState } from "react-use-websocket";

type Props = {
  readyState: ReadyState;
};

export default function WsStatusIcon({ readyState }: Props) {
  const statusColor = {
    [ReadyState.CONNECTING]: "greenyellow",
    [ReadyState.OPEN]: "teal",
    [ReadyState.CLOSING]: "yellow",
    [ReadyState.CLOSED]: "red",
    [ReadyState.UNINSTANTIATED]: "ivory",
  }[readyState];

  return (
    <div className="pr-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={statusColor}
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke={statusColor}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    </div>
  );
}
