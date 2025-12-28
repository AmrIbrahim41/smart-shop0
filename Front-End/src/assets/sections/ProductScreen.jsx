import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom' 
import axios from 'axios'
import { Row, Col, Image, ListGroup, Card, Button } from 'react-bootstrap'
import API from '../../api'

const ProductScreen = () => {
  const [product, setProduct] = useState(null)
  
  const { id } = useParams() 

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        
        const response = await axios.get(`${API.PRODUCTS}${id}/`)
        setProduct(response.data)
      } catch (error) {
        console.error('Error fetching product details!', error)
      }
    }

    fetchProduct()
  }, [id]) 

  if (!product) {
    return <h3 className='py-3'>Loading product details...</h3>
  }

  return (
    <div>
      <Link to="/" className="btn btn-light my-3">
        Go Back
      </Link>

      <Row>
        <Col md={6}>
          <Image 
            src={product.image} 
            alt={product.name} 
            fluid 
          />
        </Col>

        <Col md={3}>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <h3>{product.name}</h3>
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Rating: </strong> {product.rating} ({product.numReviews} reviews)
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Price: </strong> {product.price} EGP
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Description: </strong> {product.description}
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={3}>
          <Card>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Row>
                  <Col>Price:</Col>
                  <Col>
                    <strong>{product.price} EGP</strong>
                  </Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Status:</Col>
                  <Col>
                    {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
                  </Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Button
                  className='btn-block w-100'
                  type='button'
                  disabled={product.countInStock === 0}
                >
                  Add To Cart
                </Button>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ProductScreen