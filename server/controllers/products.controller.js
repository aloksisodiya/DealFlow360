import * as productService from "../services/products.services.js";

export async function getProducts(req, res) {
  try {
    const { category, search, tier } = req.query;
    const products = await productService.listProducts({ category, search, tier });
    return res.json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getProduct(req, res) {
  try {
    const product = await productService.getProductById(req.params.id);
    return res.json({ success: true, data: product });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
}

export async function createProduct(req, res) {
  try {
    const product = await productService.createProduct(req.body);
    return res.status(201).json({ success: true, message: "Product created", data: product });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return res.json({ success: true, message: "Product updated", data: product });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const result = await productService.deleteProduct(req.params.id);
    return res.json({ success: true, message: "Product deleted", data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
