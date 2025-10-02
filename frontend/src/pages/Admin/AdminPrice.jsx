import React, { useState, useEffect } from 'react';
import PageTitle from '../../components/PageTitle';
import axiosInstance from '../../helpers/axiosinstance';
import { message, Table, Modal, Form, Input, Button, InputNumber, Card, Space, Popconfirm } from 'antd';
import { useDispatch } from 'react-redux';
import { showLoading, hideLoading } from '../../redux/alertsSlice';

const { Search } = Input;

function AdminPrice() {
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [prices, setPrices] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    pageSizeOptions: ['10', '20', '50', '100']
  });
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const columns = [ 
    { 
      title: 'Bus Name', 
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 150,
      ellipsis: true
    },
    { 
      title: 'From', 
      dataIndex: 'from',
      key: 'from',
      sorter: true,
      width: 120,
      ellipsis: true
    },
    { 
      title: 'To', 
      dataIndex: 'to',
      key: 'to',
      sorter: true,
      width: 120,
      ellipsis: true
    },
    { 
      title: 'Price (ZMW)', 
      dataIndex: 'price',
      key: 'price',
      sorter: true,
      width: 120,
      render: (price) => `K${parseFloat(price).toFixed(2)}`,
      align: 'right'
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <i
            className='ri-pencil-line'
            onClick={() => handleEdit(record)}
            style={{ 
              cursor: 'pointer', 
              color: '#409c44', 
              fontSize: '16px',
              padding: '4px'
            }}
            title="Edit"
          />
          <Popconfirm
            title="Delete Price"
            description="Are you sure you want to delete this price?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ 
              style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }
            }}
            cancelButtonProps={{ 
              style: { color: '#409c44', borderColor: '#409c44' }
            }}
          >
            <i
              className='ri-delete-bin-line'
              style={{ 
                cursor: 'pointer', 
                color: '#ff4d4f', 
                fontSize: '16px',
                padding: '4px'
              }}
              title="Delete"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Fetch prices with pagination and search
  const fetchPrices = async (page = 1, size = 10, search = '') => {
    try {
      setLoading(true);
      dispatch(showLoading());
      
      const requestData = {
        page,
        limit: size,
        search: search.trim()
      };

      // Use POST method as defined in your router
      const response = await axiosInstance.post('/api/prices/get-all-prices', requestData);
      
      if (response.data.success) {
        setPrices(response.data.data);
        setPagination(prev => ({
          ...prev,
          current: response.data.pagination.current,
          pageSize: response.data.pagination.pageSize,
          total: response.data.pagination.total
        }));
      } else {
        message.error(response.data.message || 'Failed to fetch prices');
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      message.error('Failed to fetch prices. Please try again.');
    } finally {
      setLoading(false);
      dispatch(hideLoading());
    }
  };

  // Initial data load
  useEffect(() => {
    fetchPrices();
  }, []);

  // Handle table changes (pagination, sorting, filtering)
  const handleTableChange = (newPagination, filters, sorter) => {
    const { current, pageSize } = newPagination;
    fetchPrices(current, pageSize, searchText);
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    fetchPrices(1, pagination.pageSize, value);
  };

  // Handle search reset
  const handleSearchReset = () => {
    setSearchText('');
    fetchPrices(1, pagination.pageSize, '');
  };

  // Handle add new price
  const handleAdd = () => {
    setSelectedPrice(null);
    setShowPriceForm(true);
    form.resetFields();
  };

  // Handle edit price
  const handleEdit = (price) => {
    setSelectedPrice(price);
    setShowPriceForm(true);
    form.setFieldsValue({
      name: price.name,
      from: price.from,
      to: price.to,
      price: parseFloat(price.price)
    });
  };

  // Handle delete price
  const handleDelete = async (id) => {
    try {
      dispatch(showLoading());
      const response = await axiosInstance.delete(`/api/prices/delete-price/${id}`);
      
      if (response.data.success) {
        message.success('Price deleted successfully');
        fetchPrices(pagination.current, pagination.pageSize, searchText);
      } else {
        message.error(response.data.message || 'Failed to delete price');
      }
    } catch (error) {
      console.error('Error deleting price:', error);
      message.error('Failed to delete price. Please try again.');
    } finally {
      dispatch(hideLoading());
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      dispatch(showLoading());
      
      const priceData = {
        name: values.name.trim(),
        from: values.from.trim(),
        to: values.to.trim(),
        price: parseFloat(values.price)
      };

      let response;
      if (selectedPrice) {
        // Update existing price
        response = await axiosInstance.post(`/api/prices/update-price/${selectedPrice._id}`, priceData);
      } else {
        // Add new price
        response = await axiosInstance.post('/api/prices/add-price', priceData);
      }
      
      if (response.data.success) {
        message.success(`Price ${selectedPrice ? 'updated' : 'created'} successfully`);
        setShowPriceForm(false);
        form.resetFields();
        fetchPrices(pagination.current, pagination.pageSize, searchText);
      } else {
        message.error(response.data.message || `Failed to ${selectedPrice ? 'update' : 'create'} price`);
      }
    } catch (error) {
      console.error('Error saving price:', error);
      message.error(`Failed to ${selectedPrice ? 'update' : 'create'} price. Please try again.`);
    } finally {
      dispatch(hideLoading());
    }
  };

  // Handle modal cancel
  const handleCancel = () => {
    setShowPriceForm(false);
    setSelectedPrice(null);
    form.resetFields();
  };

  return (
    <div>
      <Card>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <PageTitle title="Manage Prices" />
          <Button
            type="primary"
            icon={<i className="ri-add-line"></i>}
            onClick={handleAdd}
            size="large"
            style={{ backgroundColor: '#409c44', borderColor: '#409c44' }}
          >
            Add Price
          </Button>
        </div>

        {/* Search Section */}
        <div className="mb-3">
          <Space.Compact style={{ width: '100%', maxWidth: '400px' }}>
            <Search
              placeholder="Search by bus name, from, or to location..."
              allowClear
              enterButton={
                <Button 
                  type="primary" 
                  style={{ backgroundColor: '#409c44', borderColor: '#409c44' }}
                >
                  Search
                </Button>
              }
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
            />
          </Space.Compact>
          {searchText && (
            <div className="mt-2">
              <span className="text-muted">
                Searching for: "<strong>{searchText}</strong>" 
                <Button 
                  type="link" 
                  size="small" 
                  onClick={handleSearchReset}
                  style={{ padding: '0 8px', color: '#409c44' }}
                >
                  Clear
                </Button>
              </span>
            </div>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={prices}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total, range) => 
              `Showing ${range[0]}-${range[1]} of ${total} prices`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          size="middle"
          bordered
          style={{ backgroundColor: 'white' }}
        />
      </Card>

      <Modal
        title={
          <div>
            <i className={`${selectedPrice ? 'ri-edit-line' : 'ri-add-line'} me-2`}></i>
            {selectedPrice ? 'Edit Price' : 'Add New Price'}
          </div>
        }
        open={showPriceForm}
        onCancel={handleCancel}
        footer={null}
        width={500}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-3"
        >
          <Form.Item
            name="name"
            label="Bus Name"
            rules={[
              { required: true, message: 'Please enter bus name' },
              { min: 2, message: 'Bus name must be at least 2 characters' },
              { max: 50, message: 'Bus name must not exceed 50 characters' }
            ]}
          >
            <Input 
              placeholder="e.g., UBZ, POWER TOOLS, EXPRESS BUS" 
              size="large"
            />
          </Form.Item>

          <div className="row">
            <div className="col-md-6">
              <Form.Item
                name="from"
                label="From"
                rules={[
                  { required: true, message: 'Please enter departure location' },
                  { min: 2, message: 'Location must be at least 2 characters' },
                  { max: 30, message: 'Location must not exceed 30 characters' }
                ]}
              >
                <Input 
                  placeholder="Departure city" 
                  size="large"
                />
              </Form.Item>
            </div>
            <div className="col-md-6">
              <Form.Item
                name="to"
                label="To"
                rules={[
                  { required: true, message: 'Please enter destination location' },
                  { min: 2, message: 'Location must be at least 2 characters' },
                  { max: 30, message: 'Location must not exceed 30 characters' }
                ]}
              >
                <Input 
                  placeholder="Destination city" 
                  size="large"
                />
              </Form.Item>
            </div>
          </div>

          <Form.Item
            name="price"
            label="Price (ZMW)"
            rules={[
              { required: true, message: 'Please enter price' },
              { type: 'number', min: 0.01, message: 'Price must be greater than 0' },
              { type: 'number', max: 9999.99, message: 'Price must not exceed K9999.99' }
            ]}
          >
            <InputNumber
              placeholder="0.00"
              size="large"
              style={{ width: '100%' }}
              step={0.01}
              precision={2}
              min={0.01}
              max={9999.99}
              formatter={value => `K ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\K\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item className="mb-0 mt-4">
            <div className="d-flex justify-content-end gap-2">
              <Button 
                onClick={handleCancel}
                size="large"
                style={{ color: '#409c44', borderColor: '#409c44' }}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                icon={<i className={`${selectedPrice ? 'ri-save-line' : 'ri-add-line'}`}></i>}
                style={{ backgroundColor: '#409c44', borderColor: '#409c44' }}
              >
                {selectedPrice ? 'Update Price' : 'Add Price'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminPrice;