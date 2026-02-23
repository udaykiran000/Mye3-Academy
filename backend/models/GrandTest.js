import mongoose from "mongoose";
import { MockTestSchema } from "./MockTest.js";

// Grand Tests are stored in a separate 'grandtests' collection
// but share the exact same schema structure as MockTests
export default mongoose.model("GrandTest", MockTestSchema, "grandtests");
