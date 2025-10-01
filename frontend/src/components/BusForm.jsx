import React, { useEffect, useState } from 'react';
import { 
  Modal, 
  Form, 
  Row, 
  Col, 
  message, 
  Input, 
  InputNumber, 
  Checkbox, 
  Button,
  Space,
  Typography,
  Card,
  Steps,
  Divider,
  ConfigProvider,
  AutoComplete
} from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../helpers/axiosinstance';
import { showLoading, hideLoading } from '../redux/alertsSlice';
import moment from 'moment';
import { 
  PlusOutlined, 
  MinusCircleOutlined, 
  CarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  DollarOutlined 
} from '@ant-design/icons';
import '../resources/BusForm.css';

const { Title, Text } = Typography;
const { Step } = Steps;

// Bus company names for autocomplete
const BUS_COMPANIES = ['ANDRICH', 'LIKILI', 'POSTBUS', 'POWERTOOLS', 'SHALOM', 'U.B.Z'];

function BusForm({ showBusForm, setShowBusForm, type = 'add', getData, selectedBus, setSelectedBus }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.alerts.loading);
  const [formChanged, setFormChanged] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [busNameOptions, setBusNameOptions] = useState([]);

  // Form initialization aligned with Bus model
  useEffect(() => {
    if (type === 'edit' && selectedBus) {
      try {
        const formData = {
          // Basic info - matches Bus model exactly
          name: selectedBus.name || '',
          drivername: selectedBus.drivername || '',
          number: selectedBus.number || '',
          capacity: selectedBus.capacity || 0,
          
          // Route info - matches Bus model exactly
          from: selectedBus.from || '',
          to: selectedBus.to || '',
          pickup: selectedBus.pickup || '',
          dropoff: selectedBus.dropoff || '',
          
          // Dates - convert to DD/MM/YYYY format
          journeydate: selectedBus.journeydate ? moment(selectedBus.journeydate).format('DD/MM/YYYY') : '',
          arrivaldate: selectedBus.arrivaldate ? moment(selectedBus.arrivaldate).format('DD/MM/YYYY') : '',
          
          // Times - keep HH:mm format
          departure: selectedBus.departure || '',
          arrival: selectedBus.arrival || '',
          
          // Price - Bus model field is 'price', not 'fare'
          price: selectedBus.price || 0,
          
          // Amenities - Bus model has nested structure
          amenities: selectedBus.amenities || {
            ac: false,
            wifi: false,
            tv: false,
            charger: false,
            bathroom: false,
            luggage: false
          },
          
          // Intermediate stops - convert times to HH:mm format
          intermediateStops: selectedBus.intermediateStops ? selectedBus.intermediateStops.map(stop => ({
            ...stop,
            arrivalTime: stop.arrivalTime || ''
          })) : [],
        };
        form.setFieldsValue(formData);
      } catch (error) {
        console.error('Error setting form values:', error);
        message.error('Error loading bus data');
      }
    } else {
      // Reset with Bus model defaults
      form.resetFields();
      form.setFieldsValue({
        pickup: 'Main Station',
        dropoff: 'Main Station',
        price: 0,
        amenities: {
          ac: false,
          wifi: false,
          tv: false,
          charger: false,
          bathroom: false,
          luggage: false
        },
        intermediateStops: []
      });
    }
    setFormChanged(false);
    setCurrentStep(0);
  }, [type, selectedBus, form]);

  // Handle bus name search for autocomplete
  const handleBusNameSearch = (searchText) => {
    if (!searchText) {
      setBusNameOptions([]);
      return;
    }
    
    const filteredOptions = BUS_COMPANIES
      .filter(company => company.toLowerCase().includes(searchText.toLowerCase()))
      .map(company => ({ value: company }));
    
    setBusNameOptions(filteredOptions);
  };

  // Auto-format time input (adds : automatically)
  const handleTimeInput = (e, fieldName) => {
    let value = e.target.value.replace(/[^0-9]/g, ''); // Remove non-digits
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + ':' + value.slice(2, 4);
    }
    
    form.setFieldValue(fieldName, value);
  };

  // Auto-format date input (adds / automatically)
  const handleDateInput = (e, fieldName) => {
    let value = e.target.value.replace(/[^0-9]/g, ''); // Remove non-digits
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + '/' + value.slice(5, 9);
    }
    
    form.setFieldValue(fieldName, value);
  };

  // Date format validator (DD/MM/YYYY)
  const validateDateFormat = (_, value) => {
    if (!value) return Promise.resolve();
    
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(value)) {
      return Promise.reject(new Error('Please use format: DD/MM/YYYY (e.g., 25/12/2024)'));
    }
    
    // Validate that the date is valid
    const parts = value.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    const date = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
    if (!date.isValid()) {
      return Promise.reject(new Error('Invalid date'));
    }
    
    return Promise.resolve();
  };

  // Time format validator (HH:mm)
  const validateTimeFormat = (_, value) => {
    if (!value) return Promise.resolve();
    
    const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(value)) {
      return Promise.reject(new Error('Please use 24-hour format: HH:mm (e.g., 14:30 or 09:00)'));
    }
    
    return Promise.resolve();
  };

  const onFinish = async (values) => {
    try {
      dispatch(showLoading());

      // Get ALL form values, not just the ones passed to onFinish
      const allFormValues = form.getFieldsValue(true);
      
      // Debug: Log both sets of values
      console.log('Values from onFinish:', values);
      console.log('All form values:', allFormValues);

      // Use allFormValues instead of values to ensure we get everything
      const formData = allFormValues;

      // Transform data to match Bus model exactly
      const transformedValues = {
        // Basic info - direct mapping
        name: formData.name || 'Bus Company',
        drivername: formData.drivername,
        number: formData.number,
        capacity: formData.capacity,
        
        // Route info - direct mapping
        from: formData.from,
        to: formData.to,
        pickup: formData.pickup || 'Main Station',
        dropoff: formData.dropoff || 'Main Station',
        
        // Dates - convert DD/MM/YYYY to ISO strings
        journeydate: formData.journeydate ? moment(formData.journeydate, 'DD/MM/YYYY').toISOString() : null,
        arrivaldate: formData.arrivaldate ? moment(formData.arrivaldate, 'DD/MM/YYYY').toISOString() : null,
        
        // Times - already in HH:mm format
        departure: formData.departure || null,
        arrival: formData.arrival || null,
        
        // Price - Bus model field is 'price'
        price: formData.price || 0,
        
        // Amenities - Bus model expects nested object
        amenities: formData.amenities || {
          ac: false,
          wifi: false,
          tv: false,
          charger: false,
          bathroom: false,
          luggage: false
        },
        
        // Intermediate stops - times already in HH:mm format
        intermediateStops: formData.intermediateStops ? formData.intermediateStops.map(stop => ({
          city: stop.city,
          dropoff: stop.dropoff,
          arrivalTime: stop.arrivalTime || '',
          additionalPrice: stop.additionalPrice || 0
        })) : []
      };

      // Debug: Log the transformed values
      console.log('Transformed values being sent to backend:', transformedValues);

      // Validate that all required fields are present before sending
      const requiredFields = ['name', 'drivername', 'number', 'capacity', 'from', 'to', 'pickup', 'dropoff', 'journeydate', 'arrivaldate', 'departure', 'arrival', 'price'];
      const missingFields = requiredFields.filter(field => {
        const value = transformedValues[field];
        return value === null || value === undefined || value === '';
      });

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        message.error(`Missing required fields: ${missingFields.join(', ')}`);
        dispatch(hideLoading());
        return;
      }

      let response = null;
      
      if (type === 'add') {
        response = await axiosInstance.post('/api/buses/add-bus', transformedValues);
      } else if (type === 'edit') {
        response = await axiosInstance.put(`/api/buses/edit-bus/${selectedBus._id}`, transformedValues);
      }

      dispatch(hideLoading());
      
      if (response?.data?.success) {
        message.success(response.data.message);
        handleModalClose();
        getData();
      } else {
        message.error(response?.data?.message || 'Operation failed');
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error('Form submission error:', error);
      message.error(error.response?.data?.message || error.message || 'An error occurred');
    }
  };

  const handleModalClose = () => {
    if (formChanged) {
      Modal.confirm({
        title: 'Discard Changes?',
        content: 'You have made some changes. Press okay to save the changes or cancel to discard them.',
        onOk: () => {
          setShowBusForm(false);
          setSelectedBus(null);
          setFormChanged(false);
        }
      });
    } else {
      setShowBusForm(false);
      setSelectedBus(null);
      setFormChanged(false);
    }
  };

  const handleFormChange = () => {
    setFormChanged(true);
  };

  const nextStep = () => {
    // Get the fields that need to be validated for the current step
    let fieldsToValidate = [];
    
    switch(currentStep) {
      case 0: // Basic Info
        fieldsToValidate = ['name', 'drivername', 'number', 'capacity'];
        break;
      case 1: // Route & Stations
        fieldsToValidate = ['from', 'to', 'pickup', 'dropoff'];
        break;
      case 2: // Schedule & Pricing
        fieldsToValidate = ['journeydate', 'arrivaldate', 'departure', 'arrival', 'price'];
        break;
      case 3: // Amenities (no required fields)
        fieldsToValidate = [];
        break;
      default:
        fieldsToValidate = [];
    }
    
    // Validate only the current step's fields
    form.validateFields(fieldsToValidate).then((values) => {
      // Debug: Log what values were validated
      console.log(`Step ${currentStep} validated values:`, values);
      console.log('All form values after validation:', form.getFieldsValue());
      
      setCurrentStep(currentStep + 1);
    }).catch((errorInfo) => {
      console.error('Validation failed:', errorInfo);
      message.error('Please complete all required fields before proceeding');
    });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Amenities list matching Bus model exactly
  const amenitiesList = [
    { key: 'ac', label: 'Air Conditioning', icon: '❄️' },
    { key: 'wifi', label: 'WiFi', icon: '📶' },
    { key: 'tv', label: 'Entertainment System', icon: '📺' },
    { key: 'charger', label: 'Phone Charger', icon: '🔌' },
    { key: 'bathroom', label: 'Restroom', icon: '🚻' },
    { key: 'luggage', label: 'Luggage Compartment', icon: '🧳' }
  ];

  const steps = [
    {
      title: 'Basic Info',
      icon: <CarOutlined />,
      content: (
        <div className="form-step">
          <div className="step-header">
            <Title level={4}>Basic Information</Title>
            <Text type="secondary">Enter the fundamental details about the bus and driver</Text>
          </div>
          
          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item 
                name="name" 
                label="Bus Company Name" 
                rules={[
                  { required: true, message: 'Please enter bus company name' }
                ]}
              >
                <AutoComplete
                  size="large"
                  options={busNameOptions}
                  onSearch={handleBusNameSearch}
                  placeholder="Type bus company name (e.g., POWERTOOLS)"
                  filterOption={false}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="drivername" 
                label="Driver Name" 
                rules={[
                  { required: true, message: 'Please enter driver name' },
                  { min: 2, message: 'Driver name must be at least 2 characters' }
                ]}
              >
                <Input size="large" placeholder="Enter driver name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item 
                name="number" 
                label="Bus Number" 
                rules={[
                  { required: true, message: 'Please enter bus number' },
                  { pattern: /^[A-Za-z0-9-]+$/, message: 'Bus number should contain only letters, numbers, and hyphens' }
                ]}
              >
                <Input size="large" placeholder="e.g., BUS-001 or ABC-123" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="capacity" 
                label="Seating Capacity" 
                rules={[
                  { required: true, message: 'Please enter seating capacity' },
                  { type: 'number', min: 1, max: 100, message: 'Capacity must be between 1 and 100' }
                ]}
              >
                <InputNumber 
                  size="large"
                  style={{ width: '100%' }} 
                  min={1} 
                  max={100}
                  placeholder="Add available seats"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )
    },
    {
      title: 'Route & Stations',
      icon: <EnvironmentOutlined />,
      content: (
        <div className="form-step">
          <div className="step-header">
            <Title level={4}>Route & Station Information</Title>
            <Text type="secondary">Define the journey route and pickup/drop-off points</Text>
          </div>

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item 
                name="from" 
                label="Origin City" 
                rules={[
                  { required: true, message: 'Please enter origin city' },
                  { min: 2, message: 'City name must be at least 2 characters' }
                ]}
              >
                <Input size="large" placeholder="Enter origin city" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="to" 
                label="Final Destination City" 
                rules={[
                  { required: true, message: 'Please enter destination city' },
                  { min: 2, message: 'City name must be at least 2 characters' }
                ]}
              >
                <Input size="large" placeholder="Enter final destination city" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item 
                name="pickup" 
                label="Pickup Station" 
                rules={[
                  { required: true, message: 'Please enter pickup station' }
                ]}
              >
                <Input size="large" placeholder="Enter pickup station" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="dropoff" 
                label="Final Drop-off Station" 
                rules={[
                  { required: true, message: 'Please enter drop-off station' }
                ]}
              >
                <Input size="large" placeholder="Enter final drop-off station" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div style={{ marginTop: 24 }}>
            <Title level={5}>Intermediate Stops</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Add other cities along the route before reaching the final destination
            </Text>
            
            <Form.List name="intermediateStops">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card key={key} size="small" style={{ marginBottom: 16 }} className="intermediate-stop-card">
                      <div className="mobile-intermediate-stop">
                        <Row gutter={[16, 16]} className="desktop-intermediate-layout">
                          <Col xs={24} sm={24} md={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'city']}
                              label="City"
                              rules={[{ required: true, message: 'City is required' }]}
                            >
                              <Input placeholder="City name" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={5}>
                            <Form.Item
                              {...restField}
                              name={[name, 'arrivalTime']}
                              label="Arrival Time (HH:mm)"
                              rules={[{ validator: validateTimeFormat }]}
                            >
                              <Input 
                                placeholder="e.g., 1630 → 16:30"
                                maxLength={5}
                                onChange={(e) => handleTimeInput(e, ['intermediateStops', name, 'arrivalTime'])}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={5}> 
                            <Form.Item
                              {...restField}
                              name={[name, 'dropoff']}
                              label="Drop-off Station"
                              rules={[{ required: true, message: 'Drop-off station is required' }]}
                            >
                              <Input placeholder="Drop-off station" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'additionalPrice']}
                              label="Additional Price (K)"
                              rules={[{ type: 'number', min: 0, message: 'Price must be 0 or greater' }]}
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                step={0.01}
                                formatter={(value) => value ? `K ${value}` : ''}
                                parser={(value) => value ? value.replace(/^K\s?/, '') : ''}
                                placeholder="Additional price"
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={2} className="remove-button-col">
                            <div className="remove-button-container">
                              <Form.Item label=" " style={{ marginBottom: 0 }}>
                                <Button 
                                  type="text" 
                                  danger 
                                  icon={<MinusCircleOutlined />} 
                                  onClick={() => remove(name)}
                                  className="remove-intermediate-stop"
                                >
                                  Remove
                                </Button>
                              </Form.Item>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </Card>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="large">
                    Add Intermediate Stop
                  </Button>
                </>
              )}
            </Form.List>
          </div>
        </div>
      )
    },
    {
      title: 'Schedule & Pricing',
      icon: <ClockCircleOutlined />,
      content: (
        <div className="form-step">
          <div className="step-header">
            <Title level={4}>Schedule & Pricing Details</Title>
            <Text type="secondary">Set the departure schedule and ticket pricing</Text>
          </div>

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item 
                name="journeydate" 
                label="Departure Date (DD/MM/YYYY)" 
                rules={[
                  { required: true, message: 'Please enter departure date' },
                  { validator: validateDateFormat }
                ]}
              >
                <Input 
                  size="large"
                  placeholder="e.g., 25/12/2024"
                  maxLength={10}
                  onChange={(e) => handleDateInput(e, 'journeydate')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="arrivaldate" 
                label="Arrival Date (DD/MM/YYYY)" 
                rules={[
                  { required: true, message: 'Please enter arrival date' },
                  { validator: validateDateFormat }
                ]}
              >
                <Input 
                  size="large"
                  placeholder="e.g., 26/12/2024"
                  maxLength={10}
                  onChange={(e) => handleDateInput(e, 'arrivaldate')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item 
                name="departure" 
                label="Departure Time (HH:mm)" 
                rules={[
                  { required: true, message: 'Please enter departure time' },
                  { validator: validateTimeFormat }
                ]}
              >
                <Input 
                  size="large"
                  placeholder="e.g., 1430 → 14:30"
                  maxLength={5}
                  onChange={(e) => handleTimeInput(e, 'departure')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="arrival" 
                label="Arrival Time (HH:mm)" 
                rules={[
                  { required: true, message: 'Please enter arrival time' },
                  { validator: validateTimeFormat }
                ]}
              >
                <Input 
                  size="large"
                  placeholder="e.g., 1845 → 18:45"
                  maxLength={5}
                  onChange={(e) => handleTimeInput(e, 'arrival')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item 
                name="price" 
                label="Ticket Price to Final Destination (K)" 
                rules={[
                  { required: true, message: 'Please enter ticket price' },
                  { type: 'number', min: 0, message: 'Price must be 0 or greater' }
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  formatter={(value) => value ? `K ${value}` : ''}
                  parser={(value) => value ? value.replace(/^K\s?/, '') : ''}
                  placeholder="Enter price to final destination"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )
    },
    {
      title: 'Amenities',
      icon: <DollarOutlined />,
      content: (
        <div className="form-step">
          <div className="step-header">
            <Title level={4}>Available Amenities</Title>
            <Text type="secondary">Select all amenities available on this bus to enhance passenger experience</Text>
          </div>

          <div className="amenities-grid">
            {amenitiesList.map((amenity) => (
              <div key={amenity.key} className="amenity-card">
                <Form.Item 
                  name={['amenities', amenity.key]} 
                  valuePropName="checked" 
                  style={{ margin: 0 }}
                >
                  <Checkbox className="amenity-checkbox">
                    <div className="amenity-content">
                      <span className="amenity-icon">{amenity.icon}</span>
                      <span className="amenity-label">{amenity.label}</span>
                    </div>
                  </Checkbox>
                </Form.Item>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#40a944',
          borderRadius: 8,
        },
      }}
    >
      <Modal
        title={
          <div className="modal-header">
            <Title level={3} style={{ margin: 0, color: 'white' }}>
              {type === 'add' ? 'Add New Bus' : 'Edit Bus Details'}
            </Title>
            {type === 'edit' && (
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>#{selectedBus?.number}</Text>
            )}
          </div>
        }
        width={1200}
        open={showBusForm}
        onCancel={handleModalClose}
        footer={null}
        destroyOnClose={true}
        className="bus-form-modal"
        maskClosable={false}
      >
        <div className="bus-form-container">
          <Steps current={currentStep} style={{ marginBottom: 32 }}>
            {steps.map((step, index) => (
              <Step key={index} title={step.title} icon={step.icon} />
            ))}
          </Steps>

          <Form 
            layout="vertical" 
            form={form} 
            onFinish={onFinish}
            onValuesChange={handleFormChange}
            scrollToFirstError
            size="large"
            requiredMark={false}
          >
            <div className="step-content">
              {steps[currentStep].content}
            </div>

            <div className="form-actions">
              {currentStep > 0 && (
                <Button size="large" onClick={prevStep}>
                  Previous
                </Button>
              )}
              
              <div style={{ flex: 1 }} />
              
              {currentStep < steps.length - 1 ? (
                <Button type="primary" size="large" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Space>
                  <Button size="large" onClick={handleModalClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    size="large"
                    htmlType="submit" 
                    loading={loading}
                    style={{ 
                      backgroundColor: '#40a944', 
                      borderColor: '#40a944',
                      minWidth: 120
                    }}
                  >
                    {type === 'add' ? 'Add Bus' : 'Update Bus'}
                  </Button>
                </Space>
              )}
            </div>
          </Form>
        </div>
      </Modal>
    </ConfigProvider>
  );
}

export default BusForm;