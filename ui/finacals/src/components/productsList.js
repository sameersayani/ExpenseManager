import react, {useEffect, useContext} from "react";
import {Table} from "react-bootstrap";
import {ProductContext} from "../ProductContext";
import ProductRow from "./products";
import {useHistory} from "react-router-dom";
import { UpdateContext } from "../UpdateProductContext";
import {API_BASE_URL} from "../config";

const ProductsList = () => {
    const[products, setProducts] = useContext(ProductContext);
    const[updateProductInfo, setUpdateProductInfo] = useContext(UpdateContext);
    let history = useHistory();

    const handleDelete = (id) => {
        fetch(`${API_BASE_URL}/product/`+ id, {
            method: "DELETE",
            headers:{
                accept: "application/json"
            }
        })
            .then(response => {
                return response.json()
            })
            .then(result => {
                if(result.status === "OK"){
                    const filteredProducts = products.data.filter(
                        (product)=> product.id !== id);
                        setProducts({data: [...filteredProducts]})
                        alert("Product deleted"); 
                }else{
                    alert("Product deletion failed !")
                }
            })
        }

        const handleUpdate = (id) => {
            console.log("its for update", id);
            const product = products.data.filter(product => product.id === id)[0];
            setUpdateProductInfo({
                ProductName: product.name,
                QuantityInStock: product.quantity_in_stock,
                QuantitySold: product.quantity_sold,
                UnitPrice: product.unit_price,
                Revenue: product.revenue,
                ProductId: id
            });
            history.push("/updateproduct");
        }

    useEffect(() => {
        fetch(`${API_BASE_URL}/product`)
        .then(response => {
            return response.json();
        }).then(result => {
            setProducts({"data": [...result.data]})
        })
    },[])
    return(
        <div>
            <Table striped bordered hover>
				<thead>
					<tr>
						<th>Id</th>
						<th>Product Name</th>
						<th>Quantity In Stock</th>
						<th>Quantity Sold</th>
						<th>Unit Price</th>
						<th>Revenue</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{products.data.map(product => (
                        <ProductRow
                            id = {product.id}
                            name = {product.name}
                            quantity_in_stock = {product.quantity_in_stock}
                            quantity_sold = {product.quantity_sold}
                            unit_price = {product.unit_price}
                            revenue = {product.revenue}
                            key = {product.id}
                            handleDelete={handleDelete}
                            handleUpdate={handleUpdate}>
                        </ProductRow>
                    ))}
				</tbody>
			</Table>
        </div>
    );
}

export default ProductsList;