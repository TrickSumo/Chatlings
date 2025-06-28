import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from "@aws-sdk/client-apigatewaymanagementapi";

export const handler = async (event) => {

  console.log("defualt handler started", event);
  const connectionId = event?.requestContext?.connectionId;
  const domainName = event?.requestContext?.domainName;
  const stage = event?.requestContext?.stage;

  const body = JSON.parse(event.body || "{}");
  const action = body.action;

  const apigw = new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`,
  });

  let message = "";

  // if (action === "ping") {
  //   message = "Pong! 🏓";
  // } else if (action === "pong") {
  //   message = "Ping! 🎯";
  // } else {
  //   message = `Unknown action: ${action}`;
  // }

  switch(action) {
    case "createGroup":
      message = "Group created successfully!";
    case "ping":
      message = "Pong! 🏓";
      break;
    case "pong":
      message = "Ping! 🎯";
      break;
    default:
      message = `Unknown action: ${action}`;
  }

  // await apigw.send(new PostToConnectionCommand({
  //   ConnectionId: connectionId,
  //   Data: Buffer.from(JSON.stringify({ message })),
  // }));

  // return { statusCode: 200 };

  console.log("yyaa",body?.requestId);
  // return {
  //   statusCode: 200,
  //   body: JSON.stringify({ message:"hhhkh3ne7773", requestId: body?.requestId }),
  // };
};