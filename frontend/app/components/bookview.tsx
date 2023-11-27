"use client";

type Price = {
  price: number;
  bid: number;
  ask: number;
};
type Data = {
  depth: number;
  data: [Price];
  ask_volume_total: number;
  bid_volume_total: number;
  ask_volume_total_percentage: number;
  bids_volume_total_percentage: number;
};
type Props = {
  obj: string;
};

const Bookview = ({ obj }: Props) => {
  if (!obj) {
    return null;
  }
  const {
    data,
    depth,
    ask_volume_total,
    bid_volume_total,
    ask_volume_total_percentage,
    bids_volume_total_percentage,
  }: Data = JSON.parse(obj);

  const bidColor = "sky";
  const askColor = "pink";

  const handleCreateOrder = () => {
    console.log();
  };

  return (
    <div className="p-0 w-80">
      <h2 className="text-gray-600">Order book depth {depth}</h2>
      <div className="space-x-2 mt-3 mb-3">
        <span>Total ask volume</span>
        <span className={`text-${askColor}-800`}>
          {ask_volume_total}({ask_volume_total_percentage})%
        </span>
      </div>
      <div className="border-solid border-2 border-gray-300 p-3 overflow-auto">
        <div className="scroll-smooth ">
          {data.map((x: Price, i) => (
            <div key={i} className="divide-y divide-slate-200">
              <div
                className={
                  i < depth
                    ? "border-1 flex m-1 space-x-4 cursor-pointer hover:bg-pink-100"
                    : "border-1 flex m-1 space-x-4 cursor-pointer hover:bg-sky-100"
                }
              >
                <div className={`flex-1 text-right text-sky-800`}>{x.bid}</div>
                <div className="flex-1 text-center text-gray-500">
                  {x.price}
                </div>
                <div className={`flex-1 text-left text-pink-800`}>{x.ask}</div>
              </div>
              {i === depth - 1 ? <div></div> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="space-x-2 mt-3 mb-3">
        <span>Total bid volume</span>
        <span className={`text-${bidColor}-800`}>
          {bid_volume_total}({bids_volume_total_percentage}%)
        </span>
      </div>
    </div>
  );
};

export default Bookview;
