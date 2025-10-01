import mongoose from 'mongoose';

const priceSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  from:    { type: String, required: true },
  to:      { type: String, required: true },
  price:   { type: Number, required: true },
});

const Price = mongoose.model('Price', priceSchema);
export default Price;
