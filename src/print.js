import {
    Button,
    Layout,
    notification,
    Modal,
    Alert,
    Tag,
    Result,
    Descriptions,
    Badge, Spin, Icon
} from "antd";
import BraftEditor from "braft-editor";
import React from "react";
import 'antd/dist/antd.css';
import 'braft-editor/dist/index.css'

const {Header, Content, Footer, Sider} = Layout;
const {confirm} = Modal;

export default class Print extends React.Component {
    state = {
        editorState: BraftEditor.createEditorState(''), // 设置编辑器初始内容
        outputHTML: '',
        version:'Init',
        visible: false,
        connected: false,
        printConnected: false,
        initConnected: true
    };

    handleChange = (editorState) => {
        this.setState({
            editorState: editorState,
            outputHTML: editorState.toHTML()
        })
    };
    handleMission = () => {
        let LoginHeader = new Headers({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        });
        fetch('http://localhost:4396/createMission', {
            method: 'post',
            headers: LoginHeader,
            body: JSON.stringify({html: this.state.outputHTML}),
            mode: 'cors'
        })
            .then(res => res.json())
            .then(data => {
                if (data.code === "OK") {
                    notification.success({
                        message: `成功！`,
                        description:
                            '您已提交了一个打印任务到打印机！',
                    });
                } else if (data.code === "NotFound") {
                    notification.error({
                        message: `错误！`,
                        description:
                            '您的系统找不到打印机在哪里！请确认打印机连接状态后重新启动系统！',
                    });
                }
            })
            .catch(function (error) {
                console.log(error);
            });

    };

    connect = () => {
        let LoginHeader = new Headers({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        });
        fetch('http://localhost:4396/ping', {
            method: 'post',
            headers: LoginHeader,
            mode: 'cors'
        })
            .then(res => res.json())
            .then(data => {
                if (data.code === "OK" && this.state.connected === false) {
                    notification.success({
                        message: `成功！`,
                        description:
                            '系统连接成功！',
                    });
                    this.setState({
                        visible: false,
                        connected: true,
                        initConnected: false,
                        version:data.version,
                    });
                    if (data.printConnected === "OK") {
                        this.setState({
                            printConnected: true
                        })
                    }
                }
            })
            .catch(function (error) {
                this.setState({
                    visible: true,
                    connected: false,
                    initConnected: true
                });
                console.log(error)
            }.bind(this));

    };

    handleExit = () => {
        confirm({
            centered: true,
            title: '您是否确定要退出打印机?',
            content: '请您再三确认是否要退出打印机程序，\n在您点击确认按钮后，系统将会强制关闭打印机程序，' +
                '这将会导致您丢失未传输给打印机的打印指令队列，同时也意味着您的打印机将以不可控状态继续打印未完成的指令集！',
            onOk: this.exitSystem
        });
    };

    exitSystem = () => {
        let LoginHeader = new Headers({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        });
        fetch('http://localhost:4396/exit', {
            method: 'post',
            headers: LoginHeader,
            mode: 'cors'
        })
            .then(res => res.json())
            .then(data => {
                if (data.code === "OK") {
                    notification.success({
                        message: `成功！`,
                        description:
                            '系统即将在三秒后自动退出',
                    });
                    setTimeout(window.close, 3000)
                }
            })
            .catch(function (error) {
                notification.error({
                    message: `失败！`,
                    description:
                        '系统与服务器连接失败！',
                });
                console.log(error)
            });
    };

    createMission = () => {
        if (this.state.printConnected === false) {
            Modal.error({
                title: '错误！',
                content: (<div>您的系统找不到打印机在哪里！<br/>请确认打印机连接状态后重新启动系统！</div>),
            });
            return;
        }
        if (this.state.outputHTML === "") {
            notification.error({
                message: `错误！`,
                description:
                    '您不能提交一个空文本到打印机！',
            });
            return
        }
        confirm({
            title: '确认打印',
            content: '请问您确认打印吗？',
            onOk: this.handleMission,
        });
        console.log(this.state.outputHTML);
    };

    componentDidMount() {
        // 每三秒测试一次到服务器的连接
        setInterval(this.connect, 3000)
    }

    render() {
        const {editorState, connected, printConnected,initConnected,version} = this.state;

        const controls = [
            'undo', 'redo'
        ];
        let serverConn, printConn;

        if (connected) {
            serverConn = <Badge status="processing" text="Running"/>
        } else {
            serverConn = <Badge status="error" text="Stop!"/>
        }

        if (printConnected) {
            printConn = <Badge status="processing" text="Running"/>
        } else {
            printConn = <Badge status="error" text="Stop!"/>
        }

        return (
            <Spin tip="Loading..." spinning={initConnected}>
                <Layout>
                    <Sider
                        breakpoint="lg"
                        collapsedWidth="0"
                        width="300"
                        onBreakpoint={broken => {
                            console.log(broken);
                        }}
                        onCollapse={(collapsed, type) => {
                            console.log(collapsed, type);
                        }}
                        style={{
                            height: '100vh',
                            backgroundColor: '#555555'
                        }}
                    >
                        <div className="LOGO">
                            盲文打印机
                        </div>
                        <Descriptions style={{backgroundColor: '#555555'}} title="系统状态" column={1} bordered>
                            <Descriptions.Item label="服务器端连接：" style={{backgroundColor: '#555555'}}>
                                {serverConn}
                            </Descriptions.Item>
                            <Descriptions.Item label="打印机端连接：" style={{backgroundColor: '#555555'}}>
                                {printConn}
                            </Descriptions.Item>
                        </Descriptions>
                        <div>
                            <Button style={{float: 'bottom'}} type="danger" onClick={this.handleExit}
                                    block>退出系统</Button>
                        </div>
                    </Sider>
                    <Layout>
                        <Header
                            style={{
                                background: '#fff',
                                padding: 0,
                                fontSize: '2em',
                                textAlign: "left",
                                paddingLeft: 30
                            }}>
                            > 打印任务创建面板
                        </Header>
                        <Alert
                            message="警告"
                            description="本版本程序为开发者预览版，非最终Release发布版本，可能存在误操作的风险，请务必人为确认打印机的状态！"
                            type="error"
                        />
                        <Content style={{margin: '24px 16px 0'}}>
                            <div style={{padding: 24, background: '#fff', minHeight: 360}}>
                                <div>
                                    <div>
                                        <BraftEditor
                                            controls={controls}
                                            value={editorState}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                    <hr/>
                                    <div style={{textAlign: "right"}}>
                                        <Button type="primary" size={"large"} onClick={this.createMission}>
                                            打印
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Content>
                        <Footer style={{textAlign: 'center'}}>Braille Print ©2019 Created by Shanghai Jian Qiao U.
                            Braille
                            Print
                            Team Project<Tag color="purple">{version}</Tag>
                        </Footer>
                    </Layout>
                    <Modal
                        centered={true}
                        title="错误！"
                        visible={this.state.visible}
                        footer={null}
                    >
                        <Result
                            status="404"
                            title="404"
                            subTitle={<div>
                                <p>系统无法连接到服务器</p>
                                <p>请重新启动系统服务器</p>
                            </div>}
                        />,
                    </Modal>
                    <Modal
                        centered={true}
                        title="系统正在连接服务器中！"
                        visible={this.state.initConnected}
                        footer={null}
                    >
                        <Result
                            icon={<Icon type="smile" theme="twoTone"/>}
                            title="系统正在连接中!请稍后"
                        />
                    </Modal>
                </Layout>
            </Spin>
        )
    }
}