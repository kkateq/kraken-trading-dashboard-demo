"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
import { useKrakenDataContext } from "./kraken_data_provider";

import { LogLevel } from "./commons";

const LogLevelColors = {
  [LogLevel.INFO]: "text-gray-600",
  [LogLevel.ERROR]: "text-red-600",
  [LogLevel.WARNING]: "text-orange-400",
};

export const MessageLog = () => {
  const { logMessages } = useKrakenDataContext();
  const [open, setOpen] = useState(1);
  const handleOpen = (value: number) => setOpen(open === value ? 0 : value);

  return (
    <div
      className="overflow-auto bg-gray-200 border-2 rounded border-gray-400 p-2"
      style={{ maxHeight: "100px" }}
    >
      <Accordion open={open === 1}>
        <AccordionHeader onClick={() => handleOpen(1)}>Log</AccordionHeader>
        <AccordionBody>
          {logMessages &&
            logMessages.map((x, i) => {
              const color = LogLevelColors[x.level];
              return (
                <div key={i} className={`flex space-x-3 text-xs ${color}`}>
                  <div>{x.time}</div>
                  <div>{x.text}</div>
                </div>
              );
            })}
        </AccordionBody>
      </Accordion>
    </div>
  );
};

export default MessageLog;
