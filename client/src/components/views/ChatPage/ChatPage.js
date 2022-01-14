import React, { Component } from 'react'
import { Form, Icon, Input, Button, Row, Col, } from 'antd';
import io from "socket.io-client";
import { connect } from "react-redux";
import moment from "moment";
import { getChats, afterPostMessage } from '../../../_actions/chat_actions';
import { getUsers } from '../../../_actions/user_actions';
import ChatCard from './Sections/ChatCard';
import VideoCall from './Sections/VideoCall';
import { MentionsInput, Mention } from 'react-mentions'
import TextArea from 'react-mention-plugin';


export class ChatPage extends Component {


    state = {
        chatMessage: "",
        usersCall: {}
    }



    componentDidMount() {
        let server = "http://localhost:5000";


        this.props.dispatch(getChats());
        this.props.dispatch(getUsers());


        this.socket = io(server);

        this.socket.on("Output Chat Message", messageFromBackEnd => {

            console.log("Message from backend", messageFromBackEnd)
            this.props.dispatch(afterPostMessage(messageFromBackEnd));
        })
        this.refreshPid = setInterval(() => {
            this.props.dispatch(getUsers());
        }, 5000)


    }

    componentWillUnmount() {
        clearInterval(this.refreshPid);
    }

    componentDidUpdate() {
        this.messagesEnd.scrollIntoView({ behavior: 'smooth' });

    }


    handleSearchChange = (e) => {
        this.setState({
            chatMessage: e.target.value
        })
    }



    renderCards = () =>
        this.props.chats.chats
        && this.props.chats.chats.map((chat) => {
            if (chat.sender) {
                return <ChatCard key={chat._id}  {...chat} />
            }

        });

    callbackFunction = (childData) => {
        this.setState({ usersCall: childData })
    }

    phoneCall = () => {
        console.log("in function")
        return <VideoCall parentCallback={this.callbackFunction} />

        //return <VideoCall {...this.props.userData}/>
    }



    renderUsers = () => {
        const { userList } = this.props;

        console.log("renderusers", userList);
        return userList.map((user) => {
            console.log("user is:", user)
            if (user.token) {
                return (
                    <Row>
                        <Col span={8}>
                            <h2>{user.name}</h2>
                        </Col>

                        <Col span={8}>
                            <a href="/call" type="secondary" style={{ width: '80%' }} onClick={this.phoneCall} >
                                <Icon type="phone" />
                            </a>
                        </Col>
                    </Row>


                )
            }

        })

    }


    submitChatMessage = (e) => {
        e.preventDefault();

        let chatMessage = this.state.chatMessage
        let userId = this.props.userData._id
        let userName = this.props.userData.name;
        let userImage = this.props.userData.image;
        let nowTime = moment();
        let type = "Text"

        this.socket.emit("Input Chat Message", {
            chatMessage,
            userId,
            userName,
            userImage,
            nowTime,
            type
        });
        this.setState({ chatMessage: "" })
    }


    render() {

        console.log(this.props.userList);

        const mentionData = this.props.userList.map((user) => ({
            id: user._id,
            display: user.name
        }))

        return (
            <React.Fragment>
                <Row>
                    <Col span={18}>
                        <div>
                            <p style={{ fontSize: '2rem', textAlign: 'center' }}> Real Time Chat</p>
                        </div>

                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div className="infinite-container" style={{ height: '500px', overflowY: 'scroll' }}>
                                {this.props.chats && (
                                    <div>{this.renderCards()}</div>
                                )}
                                <div
                                    ref={el => {
                                        this.messagesEnd = el;
                                    }}
                                    style={{ float: "left", clear: "both" }}
                                />
                            </div>



                            <Row >
                                <Form layout="inline" onSubmit={this.submitChatMessage}>
                                    <Col span={18}>
                                        
                                        <MentionsInput id="message"
                                            prefix={<Icon type="message" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                            placeholder="Let's start talking"
                                            type="text"
                                            value={this.state.chatMessage} onChange={this.handleSearchChange}>
                                            <Mention
                                                trigger="@"
                                                data={mentionData}
                                            />

                                        </MentionsInput>
                                    </Col>
                                    <Col span={2}>

                                    </Col>

                                    <Col span={4}>
                                        <Button type="primary" style={{ width: '100%' }} onClick={this.submitChatMessage} htmlType="submit">
                                            <Icon type="enter" />
                                        </Button>
                                    </Col>
                                </Form>
                            </Row>
                        </div>
                    </Col>

                    <Col span={6}>
                        <p style={{ fontSize: '2rem', textAlign: 'left' }}>Online Users</p>

                        <div>{this.renderUsers()}</div>

                    </Col>
                </Row>

            </React.Fragment>
        )
    }
}

const mapStateToProps = state => {
    console.log("chatpage state is", state);
    return {
        userData: state.user.userData,
        chats: state.chat,
        userList: state.user.users || []
    }
}


export default connect(mapStateToProps)(ChatPage);
