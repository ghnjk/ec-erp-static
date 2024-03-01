import { MockMethod } from "vite-plugin-mock";
import MockUtil from "../mock_util";

const apiList = [
  {
    url: "/erp_api/supplier/search_supplier",
    method: "post"
  }
];
const mocks = MockUtil.buildMockCases(apiList);

export default [...mocks] as MockMethod[];
