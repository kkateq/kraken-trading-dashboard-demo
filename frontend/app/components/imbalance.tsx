"use client;";

import { useEffect, useCallback, useState, useRef } from "react";
import { createChart } from "lightweight-charts";
import { ImbalanceHistoryNode, LargeVolumeHistoryNode } from "./commons";
type Props = {
  largeVolumeHistory: [LargeVolumeHistoryNode] | undefined;
  imbalanceHistory: [ImbalanceHistoryNode] | undefined;
};

export default function ImbalanceChart({
  largeVolumeHistory,
  imbalanceHistory,
}: Props) {
  const imbalanceChartRef = useRef(null);
  const [imbalanceChart, setImbalanceChart] = useState(null);
  const [imbalanceChartSeries, setImbalanceChartSeries] = useState(null);

  useEffect(() => {
    if (!imbalanceChart && imbalanceHistory && imbalanceChartRef?.current) {
      const _chart = createChart(imbalanceChartRef?.current, {
        layout: {
          textColor: "black",
          background: { type: "solid", color: "white" },
        },
      });

      const _imbalanceSeries = _chart.addLineSeries({
        color: "#2c2829",
      });

      _imbalanceSeries.setData(imbalanceHistory);

      _chart.timeScale().fitContent();

      setImbalanceChart(_chart);
      setImbalanceChartSeries(_imbalanceSeries);
    }
  }, [imbalanceHistory, imbalanceChartRef?.current]);

  useEffect(() => {
    if (imbalanceHistory && imbalanceChart) {
      if (imbalanceChartSeries) {
        const imbalance = imbalanceHistory[imbalanceHistory.length - 1];
        imbalanceChartSeries.update({
          time: parseFloat(imbalance.time),
          value: parseFloat(imbalance.value),
        });
      }
    }
  }, [imbalanceHistory]);

  return <div className="w-full h-full" ref={imbalanceChart}></div>;
}
