import { Page } from "@zo/moal";

import { NextPage } from "next";
import {
  Events,
  Founders,
  Task,
  Visitors,
} from "../../components/helpers/insights";

const Invitations: NextPage = () => {
  return (
    <Page>
      <div>
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-medium">Bulletins</h1>
        </header>
      </div>
      <div className="w-full mt-8 flex flex-wrap sm:flex-nowrap">
        <div className="w-full sm:w-[300px] flex h-content sm:mr-2">
          <Task />
        </div>
        <div className="flex flex-grow sm:ml-2 sm:mt-0 mt-2">
          <div className="flex flex-col w-full h-full">
            <div className="flex flex-col sm:flex-row gap-4">
              <Visitors />
              <Events />
            </div>
            <Founders />
          </div>
        </div>
      </div>
    </Page>
  );
};

export default Invitations;
