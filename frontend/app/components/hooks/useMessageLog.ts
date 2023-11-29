// "use client";

// import { useCallback, useState } from "react";
// import { LogLevel } from "../commons";

// export function useMessageLog() {
//   const [messages, setMessageHistory] = useState([]);
//   const addMessage = (text: string, level: LogLevel = LogLevel.INFO) => {
//     if (text) {
//       setMessageHistory((prev) =>
//         prev.concat({
//           // @ts-ignore
//           text,
//           level,
//         })
//       );
//     }
//   };
//   const clearLog = () => setMessageHistory(() => []);
//   return { messages, addMessage, clearLog };
// }

// export default useMessageLog;
