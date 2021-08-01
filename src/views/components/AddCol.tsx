import React,{useEffect, useState} from 'react'
import { Modal,Button,Form ,Input} from 'antd'

interface Props{
  onChange:(option:string)=>void
}
function AddModal(props:Props){
  const {onChange} = props;
  const [modalVisible, setIsModalVisible] = useState(false);

  const handleAdd = ()=>{
    setIsModalVisible(true)
  }

  const handleOk =()=>{
    form.submit()
  }
  const handleCancel = () =>{
    setIsModalVisible(false)
  } 
  const [form] = Form.useForm()

  useEffect(()=>{
    modalVisible && form.setFieldsValue({
      optionName:''
    })
    return ()=>{form.resetFields()}
  },[modalVisible,form])

  const onFinish = ({optionName}:{optionName:string})=>{
    onChange(optionName)
    setIsModalVisible(false)
  }

  return  <>
         <Modal 
            title="添加选项"
            visible={modalVisible}
            onOk={handleOk}
            onCancel={handleCancel} 
          >
            <Form onFinish={onFinish} form={form}>
                <Form.Item label='选项名称' name='optionName' rules={[{ required: true}]} >
                    <Input/>
                </Form.Item>
              </Form>  
          </Modal>
           <Button onClick={handleAdd} type="link">添加选项</Button>
          </>
}
export default AddModal