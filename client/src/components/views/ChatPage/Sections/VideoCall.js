import React, { useEffect, useState, useRef } from 'react';
//import { Form, Icon, Input, Button, Row, Col, } from 'antd';
import Peer from 'simple-peer';
import io from "socket.io-client";
import styled from "styled-components";

const Container = styled.div`
  margin-top:300;
  height: 1500;
  width: 50vw;
  display: flex;
  flex-direction: column;
  align-items:center;
  justify-content:center;
 
  `;

const Row = styled.div`
  display: flex;
  width: 100%;
`;

const Video = styled.video`
 
  width:100%;
  height:100%;
  object-fit: cover;
  
  
`;

const Button = styled.div`
font-weight: 600;
cursor: pointer;
padding: 4px 22px;
background-color: #b72525;
color: #fff;
border-radius: 5px;
`

function VideoCall(props) {
 
  console.log(props)
  const [yourID, setYourID] = useState("");
  const [users, setUsers] = useState({});
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();

  useEffect(() => {
    socket.current = io.connect('http://localhost:5000');
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      setStream(stream);
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    })
    socket.current.emit("getUsers");
    socket.current.on("yourID", (id) => {
      setYourID(id);
    })
    socket.current.on("allUsers", (users) => {
      console.log(users)
      setUsers(users);
     
    })


    socket.current.on("hey", (data) => {
      console.log('Set receiving call....');
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    })

  }, []);

  function callPeer(id) {
    console.log("calling peer")
    const peer = new Peer({
      initiator: true,
      trickle: false,
    //   config: {

    //     iceServers: [
    //         {
    //             urls: "stun:numb.viagenie.ca",
    //             username: "sultan1640@gmail.com",
    //             credential: "98376683"
    //         },
    //         {
    //             urls: "turn:numb.viagenie.ca",
    //             username: "sultan1640@gmail.com",
    //             credential: "98376683"
    //         }
    //     ]
    // },
      stream: stream,
    });

    peer.on("signal", data => {
      console.log('CallUSER:::', id, yourID )
      socket.current.emit("callUser", { userToCall: id, signalData: data, from: yourID })
    })

    peer.on("stream", stream => {
      console.log('Set partner video stream....');
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    socket.current.on("callAccepted", signal => {
      console.log('callAccepted....');
      setCallAccepted(true);
      peer.signal(signal);
    })

  }

  function acceptCall() {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", data => {
      socket.current.emit("acceptCall", { signal: data, to: caller })
    })

    peer.on("stream", stream => {
      partnerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);

     
    
      
  }


  let UserVideo;
  if (stream) {
    UserVideo = 
    <>
      <Video style={{marginLeft:40,marginRight:40,marginBottom:20}} muted ref={userVideo} autoPlay />
    </>
      
  }

  let PartnerVideo;
  if (callAccepted) {
    PartnerVideo = (
      <>
      <Video style={{marginLeft:40,marginRight:40,marginBottom:20}} ref={partnerVideo} autoPlay />
      </>
    );
  }

  let incomingCall;
  if (receivingCall) {
    incomingCall = (
      <div>
        <h1>{caller} is calling you</h1>
        <button onClick={acceptCall}>Accept</button>
      </div>
    )

  }



  function callDirect(key){
    alert('Call?');
    callPeer(key);
  }

  function disconnectMeeting(){
    console.log("disconnecting....");

  }

 let meetingEndButton;
  if(stream){
    meetingEndButton = (
      <button onClick = {() => disconnectMeeting()} style={{cursor:'pointer',margin:40,marginLeft:300,marginTop:5}}>Disconnect</button>
    )
  }

  let meetingEndPeerButton;
  if(callAccepted){
  meetingEndPeerButton = (
    <button onClick = {() => disconnectMeeting()} style={{margin:40,marginLeft:615,marginTop:5}}>Disconnect</button>
    )
    console.log("remove the render")
    incomingCall = (
      <></>
    )
  }
  
   
  // const sendData = () => {
    
  //   //props.parentCallback(users);
  // }

  //sendData();

  return (
    
    <Container>
      <Row>
        {UserVideo}
        {PartnerVideo}
      </Row>

      <Row>
        {meetingEndButton}
        {meetingEndPeerButton}
      </Row>
      
      <Row>
        {Object.keys(users).map(key => {
          if (key === yourID) {
            return null;
          }
          return (
            
            <button  onClick={() => callPeer(key)}>Call {key}</button>
          );
        })}
      </Row>
      <Row>
        {incomingCall}
      </Row>
    </Container>
    

  );
}

export default VideoCall;