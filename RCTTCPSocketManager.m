//
//  RCTTCPSocketManager.m
//  RCTTCPSocket
//
//  Created by Patrick on 8/7/15.
//  Copyright (c) 2015 Patrick Lin. All rights reserved.
//

#import "RCTTCPSocketManager.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "GCDAsyncSocket.h"
#import "RCTSparseArray.h"
#import "RCTUtils.h"

@implementation GCDAsyncSocket (React)

- (NSNumber *)reactTag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactTag:(NSNumber *)reactTag
{
  objc_setAssociatedObject(self, @selector(reactTag), reactTag, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

@interface RCTTCPSocketManager () <GCDAsyncSocketDelegate>

@end

@implementation RCTTCPSocketManager
{
    RCTSparseArray *_sockets;
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _sockets = [[RCTSparseArray alloc] init];
  }
  return self;
}

- (void)dealloc
{
  for (GCDAsyncSocket *socket in _sockets.allObjects) {
    socket.delegate = nil;
    [socket disconnect];
  }
}

RCT_EXPORT_METHOD(connect:(NSString *)host port:(NSUInteger)port socketID:(NSNumber *)socketID)
{
  GCDAsyncSocket *tcpSocket = [[GCDAsyncSocket alloc] initWithSocketQueue:nil];
  tcpSocket.delegate = self;
  tcpSocket.delegateQueue = dispatch_get_main_queue();
  tcpSocket.reactTag = socketID;
  _sockets[socketID] = tcpSocket;
  [tcpSocket connectToHost:host onPort:port error:nil];
}

RCT_EXPORT_METHOD(send:(NSString *)message socketID:(NSNumber *)socketID encoded:(BOOL)encoded)
{
  if (encoded) {
      [_sockets[socketID] writeData:[[NSData alloc] initWithBase64EncodedString:message options:NSDataBase64DecodingIgnoreUnknownCharacters] withTimeout:-1 tag:-1];
  }
  else {
    [_sockets[socketID] writeData:[message dataUsingEncoding:[NSString defaultCStringEncoding]] withTimeout:-1 tag:-1];
  }
  [_sockets[socketID] readDataWithTimeout:-1 tag:-1];
}

RCT_EXPORT_METHOD(close:(NSNumber *)socketID)
{
  [_sockets[socketID] disconnect];
  _sockets[socketID] = nil;
}

#pragma mark - RCTSRTCPSocketDelegate methods

- (void)socket:(GCDAsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag
{
  NSDictionary* body = @{
                         @"data": [data base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength],
                         @"id": sock.reactTag
                         };
  [_bridge.eventDispatcher sendDeviceEventWithName:@"TCPSocketMessage" body:body];
}

- (void)socket:(GCDAsyncSocket *)sock didConnectToHost:(NSString *)host port:(uint16_t)port
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"TCPSocketOpen" body:@{
                                                                           @"id": sock.reactTag
                                                                          }];
  [sock readDataWithTimeout:-1 tag:-1];
}

- (void)socketDidDisconnect:(GCDAsyncSocket *)sock withError:(NSError *)err
{
  NSDictionary* body = nil;
  
  if (err) {
    body = @{
             @"message":[err localizedDescription],
             @"id": sock.reactTag
             };
  }
       
  else {
    body = @{
             @"id": sock.reactTag
             };
      
  }
  [_bridge.eventDispatcher sendDeviceEventWithName:@"TCPSocketClosed" body:body];
}

@end
