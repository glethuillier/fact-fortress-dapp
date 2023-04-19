import { ChangeEvent, useEffect, useState } from 'react';

import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { useSendTransaction, usePrepareSendTransaction } from 'wagmi';

import { parseEther } from 'ethers/lib/utils.js';
import { Card, Col, Row, Space, Divider, Button, Input, Select, Form, message, QRCode, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps, SelectProps } from 'antd';
import axios from 'axios';
import React from 'react';


const { TextArea } = Input;

export default function Dapp() {
  const [form] = Form.useForm();
  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [transferAmount, setTransferAmout] = useState<string>("0");
  const [key, setKey] = useState({});
  const [compute, setCompute] = useState<string>("");
  const [computeRes, setComputeRes] = useState({});
  const [functions, setFunctions] = useState({});
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [qrCode, setQrCode] = React.useState('https://github.com/pierg/zkp-hackathon');
 
  const consoleRef = React.createRef()
  const addRecentTransaction = useAddRecentTransaction();


  const onRecipientAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setReceiverAddress(e.target.value);
  }

  const onTransferAmountChange = ( e: ChangeEvent<HTMLInputElement>) => {
    setTransferAmout(e.target.value);
  }

  const { config, error } = usePrepareSendTransaction({
    request: {
      to: receiverAddress,
      value: parseEther(transferAmount || '0'),
    }
  });

  const { data, isLoading, isSuccess, sendTransaction } = useSendTransaction(config)

  const handleSendTransaction = async () => {
    sendTransaction?.();
  }

  const downloadQRCode = () => {
    const canvas = document.getElementById('myqrcode')?.querySelector<HTMLCanvasElement>('canvas');
    if (canvas) {
      const url = canvas.toDataURL();
      const a = document.createElement('a');
      a.download = 'QRCode.png';
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleGetKeyPair = async () => {
    const apiCall = () => {return axios.get('http://localhost:3000/key_pair');}
    const tokenCall = (address: string) => {return axios.get('http://localhost:3000/tokenid', {
      params : {
        'address': address
      }
    })}
    var address = ""

    apiCall()
      .then(response => {
        console.log(response.data);
        setKey(response.data['public_key'])
        // tokenCall(response.data['public_key'])
        //   .then(response => {
        //     console.log(response.data);
        //     // setPublicKey(response.data['public_key'])
        //   })
        //   .catch(error => {
        //     console.log(error);
        //   });
      })
      .catch(error => {
        console.log(error);
      });
    
  }

  const handleFetch = async () => {
    const apiCall = () => {return axios.get('http://localhost:3000/available_functions')}

    apiCall()
      .then(response => {
        console.log(response.data);
        setFunctions(response.data['proof_of_provenance'])
      })
      .catch(error => {
        console.log(error);
      });
  }

  const handleSelect = (value: string) => {
    setCompute(value)
    console.log(value)
  }

  const successMess = () => {
    messageApi.open({
      type: 'success',
      content: 'Successfully verified',
    });
  };

  const errorMess = () => {
    messageApi.open({
      type: 'error',
      content: 'Error',
    });
  }

  const { Dragger } = Upload;

  const populate_options = () => {
    const options: SelectProps['options'] = [];
    for (let i = 0; i < functions['health_data'].length; i++) {
      options.push({
        value: functions['health_data'][i],
        label: functions['health_data'][i]
      });
    }
    return options;
  }

  const onFinish = (values: any) => {
    console.log('Finish:', values);
  };
  // useEffect(() => {
  //   if (JSON.stringify(functions) != '{}') {
  //     console.log(options)
  //   }
    
  // }, [functions])
  // console.log(functions)

  return (
<div 
  class="h-14 bg-gradient-to-r from-zinc-400 to-slate-900"
  style={{
  width: '100vw',
  height: '100vh', margin: 0, 'boxSizing': 'border-box', overflow: 'hidden'}}
>
      {/* <Card bodyStyle={{background: '#C5C5C5'}} bordered={false}> */}
      {contextHolder}
      <Divider/>
      <Row>
      <Col span={12} offset={6}>
          <Card style={{ height: '55vh', top: "30%", transform: "translate(0px, 0%)", overflow: 'scroll'}} headStyle={{backgroundColor: 'rgb(100 116 139)', color: 'white', textAlign: 'center'}} title="Researchers" bordered={true}>
            <Space 
              direction="vertical"
              style={{
                display: 'flex',
              }}
            >
            <Card type='inner' bodyStyle={{height: '50vh', overflow: 'auto'}} title='Select Function'>
            <Form form={form} name="horizontal_login" layout="vertical" onFinish={onFinish}>
                <Form.Item
                    name="recipient1"
                > 
                    {JSON.stringify(key) != '{}' &&
                    <div style={{ width: '100%', fontWeight: 'bold'}}>
                        Public Keys
                        <Card bodyStyle={{overflowWrap: 'break-word'}}>{JSON.stringify(key_a)}</Card>
                        {/* <textarea readOnly={true} defaultValue={JSON.stringify(key_a)} style={{width: '100%', maxWidth: '100%', fontWeight: 'bold'}} /> */}
                    </div>
                    }
                     {JSON.stringify(key) == '{}' &&
                    <div style={{ width: '100%', fontWeight: 'bold'}}>
                        Public Key
                        <Card loading={loading}>None</Card>

                    </div>
                    }
                    <Button
                        type="primary"
                        onClick={() => {handleGetKeyPair('A')}}
                    >
                        Fetch Public Key!
                    </Button>
                </Form.Item>
              <Space>
              { JSON.stringify(functions) != '{}' && 
                  <Select
                    defaultValue="Function"
                    style={{
                      width: 300,
                    }}
                    onChange={handleSelect}
                    options={populate_options()}
                  />
              }
              { JSON.stringify(functions) == '{}' && 
                  <Select
                    defaultValue="Function"
                    style={{
                      width: 300,
                    }}
                    onChange={handleSelect}
                    options={[]}
                  />
              }
                <Button
                    type='primary'
                    onClick={handleFetch}
                  >
                  Fetch Functions
                </Button>
              </Space>
              <Divider type='horizontal' />
              <div id="myqrcode">
                <Space direction="horizontal">
                  <QRCode value={qrCode || '-'} />
                  <Button type="primary" onClick={downloadQRCode}>
                    Download
                  </Button>
                </Space>
              </div>
              </Form>
              </Card>
            </Space>
          </Card>
        </Col>
      </Row>
      {/* </Card> */}
    </div>
  )
}
