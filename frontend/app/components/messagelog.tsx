"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";

import { LogLevel, Message } from "./commons";

type Props = {
  messages: [Message];
};

const LogLevelColors = {
  [LogLevel.INFO]: "text-gray-600",
  [LogLevel.ERROR]: "text-red-600",
  [LogLevel.WARNING]: "text-orange-400",
};

export const MessageLog = ({ messages }: Props) => {
  const [open, setOpen] = useState(1);
  const handleOpen = (value: number) => setOpen(open === value ? 0 : value);

  return (
    <Accordion open={open === 1}>
      <AccordionHeader onClick={() => handleOpen(1)}>Log</AccordionHeader>
      <AccordionBody>
        {messages.map((x, i) => {
          const color = LogLevelColors[x.level];
          return (
            <div key={i} className={`text-xs ${color}`}>
              {x.text}
            </div>
          );
        })}
      </AccordionBody>
    </Accordion>
  );
};

export default MessageLog;
