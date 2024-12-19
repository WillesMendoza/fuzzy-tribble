import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket to host the Next.js static files
    const hostingBucket = new s3.Bucket(this, 'NextJsToDoApplication', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,

    });

    // Create a CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'NextJsDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(hostingBucket),
        compress: true,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
    });

    // Create a Dynamo DB table to store todo list items
    const todoTable = new dynamodb.Table(this, 'TodoTable', {
      partitionKey: { name: 'id', type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Provision a rest API using API Gateway that uses DynamoDB as an integration and define request and response mappting templates
    const todoApi = new cdk.aws_apigateway.RestApi(this, 'TodoApi', {
      defaultCorsPreflightOptions: { allowOrigins: ["*"], allowMethods: ["*"], allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token"] },
    });

    const todoApiRole = new cdk.aws_iam.Role(this, 'TodoApiRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: {
        DynamoDBAccess: new cdk.aws_iam.PolicyDocument({
          statements: [
            new cdk.aws_iam.PolicyStatement({
              actions: ['dynamodb:Scan'],
              resources: [todoTable.tableArn],
            }),
          ],
        }),
      },
    })

    const tasksResource = todoApi.root.addResource('tasks');

    // Create a GET method on the resource that uses an integration type of AWS with DynamoDB
    tasksResource.addMethod('GET', new cdk.aws_apigateway.AwsIntegration({
      service: 'dynamodb',
      action: 'Scan',
      integrationHttpMethod: "POST",
      options: {
        credentialsRole: todoApiRole,
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: todoTable.tableName,
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': `
                #set($inputRoot = $input.path('$'))
                [
                #foreach($item in $inputRoot.Items)
                    {
                        "id": "$item.id.S",
                        "description": "$item.description.S"
                    }#if($foreach.hasNext),#end
                #end
                ]
              `
            },
          },
        ],
      },
    }), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
          responseModels: {
            'application/json': apigw.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    // Create a POST method on the resource that uses an integration type of AWS with DynamoDB

    // Create a DELETE method on the resource that uses an integration type of AWS with DynamoDB


    // Deploy the Next.js static files to S3
    new s3deploy.BucketDeployment(this, 'ToDoBucketDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../out'))],
      destinationBucket: hostingBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });
  }
}
