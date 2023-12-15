import { useSelector } from "react-redux";
import { RootState } from "store/store";
import Selected from "./Selected";
import Overview from "./Overview";

const Content = () => {
  const { h3Index }: { h3Index: string } = useSelector((state: RootState) => state.selected);
  return (
    <div className="h-full">
      { h3Index ? <Selected /> : <Overview /> }
    </div>
  );
};

export default Content;