
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Row, Col, Card } from 'react-bootstrap'
import API from '../../api'

const HomeScreen = () => {
  const [products, setProducts] = useState([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(API.PRODUCTS)
        setProducts(response.data)
      } catch (error) {
        console.error('Error fetching products!', error)
      }
    }
    fetchProducts()
  }, [])

  return (
    <> 
      <h2 className="mt-4">latest products</h2>
      {products.length === 0 ? (
        <p>Loading products...</p>
      ) : (
        <Row>
          {products.map((product) => (
            <Col key={product.id} sm={12} md={6} lg={4} xl={3} className="mb-3">
              <Card>
                <Card.Img 
                  variant="top" 
                  src={product.image} 
                />
                <Card.Body>
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text>Price: {product.price} EGP</Card.Text>
                  <Card.Text>Stock: {product.countInStock}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  )
}

export default HomeScreen