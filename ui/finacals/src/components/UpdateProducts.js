import react, { useContext, useState} from 'react'
import { Form, Button, Card } from 'react-bootstrap'
import {UpdateContext} from '../UpdateProductContext'

const UpdateProduct = () => {
    const [updateProductInfo, setUpdateProductInfo] = useContext(UpdateContext);

    // Ensure controlled values
    const controlledValues = {
        ProductName: updateProductInfo.ProductName || "",
        QuantityInStock: updateProductInfo.QuantityInStock || "",
        QuantitySold: updateProductInfo.QuantitySold || "",
        UnitPrice: updateProductInfo.UnitPrice || "",
        Revenue: updateProductInfo.Revenue || "",
        ProductId: updateProductInfo.ProductId || "",
        Supplier: updateProductInfo.Supplier || "",
    };

    const updateForm = (e) => {
        setUpdateProductInfo({ ...updateProductInfo, [e.target.name]: e.target.value });
    };

    const postData = async (e) => {
        e.preventDefault();

        const url = `http://localhost:8000/product/${updateProductInfo.ProductId}`;

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: controlledValues.ProductName,
                quantity_in_stock: controlledValues.QuantityInStock,
                quantity_sold: controlledValues.QuantitySold,
                unit_price: controlledValues.UnitPrice,
                revenue: controlledValues.Revenue,
            }),
        });

        const resp = await response.json();
        alert(resp.status === "OK" ? "Product updated" : "Failed to update product");

        setUpdateProductInfo({
            ProductName: "",
            QuantityInStock: "",
            QuantitySold: "",
            UnitPrice: "",
            Revenue: "",
            ProductId: "",
            Supplier: "",
        });
    };

    return (
        <Card>
            <Card.Body>
                <Form onSubmit={postData}>
                    {Object.keys(controlledValues).map((key) => (
                        <Form.Group key={key} controlId={key}>
                            <Form.Label>{key.replace(/([A-Z])/g, " $1")}</Form.Label>
                            <Form.Control
                                type="text"
                                name={key}
                                value={controlledValues[key]}
                                onChange={updateForm}
                                placeholder={key}
                            />
                        </Form.Group>
                    ))}
                    <Button variant="primary" type="submit">
                        Submit
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default UpdateProduct;
