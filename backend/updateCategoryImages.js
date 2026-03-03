import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://adminUday:admin123@cluster0.yklrwv1.mongodb.net/Mye3Academy?retryWrites=true&w=majority";

const categorySchema = new mongoose.Schema({
  name: String,
  image: String,
}, { strict: false });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema, 'categories');

const categoryImages = {
  // Common keywords map to Unsplash images
  "sbi clerk": "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=500&auto=format&fit=crop&q=60",
  "ssc": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&auto=format&fit=crop&q=60",
  "ibps": "https://images.unsplash.com/photo-1621252179022-d39b8bc42f53?w=500&auto=format&fit=crop&q=60",
  "rrb": "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=500&auto=format&fit=crop&q=60", // railway
  "upsc": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=60", // government
  "group": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=60",
  "neet": "https://images.unsplash.com/photo-1532187863486-abf9db0c20ab?w=500&auto=format&fit=crop&q=60", // medical
  "jee": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&auto=format&fit=crop&q=60", // engineering
  "default": "https://images.unsplash.com/photo-1546410531-bea4f4b64590?w=500&auto=format&fit=crop&q=60"
};

async function update() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGODB_URL);
    console.log("Connected.");
    
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories. Updating...`);
    
    let updatedCount = 0;
    for(let i = 0; i < categories.length; i++) {
       const cat = categories[i];
       const name = (cat.name || "").toLowerCase();
       let img = categoryImages["default"];

       if (name.includes('sbi')) img = categoryImages["sbi clerk"];
       else if (name.includes('ssc')) img = categoryImages["ssc"];
       else if (name.includes('ibps')) img = categoryImages["ibps"];
       else if (name.includes('rrb')) img = categoryImages["rrb"];
       else if (name.includes('upsc')) img = categoryImages["upsc"];
       else if (name.includes('group')) img = categoryImages["group"];
       else if (name.includes('neet')) img = categoryImages["neet"];
       else if (name.includes('jee')) img = categoryImages["jee"];

       cat.image = img;
       await cat.save();
       updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} categories with relevant images.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

update();
