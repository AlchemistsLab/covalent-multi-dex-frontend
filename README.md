# Covalent - DEX Dashboard
An analytics dashboard presents multi-DEX information. You can see updated information of each DEX, including liquidity, swap, other granular and historical data, etc. The supported DEXs are SushiSwap, QuickSwap, Pangolin, SpiritSwap, and SpookySwap.

## Dashboard URL
[https://dex.coinhippo.io](https://dex.coinhippo.io)

## Data provider / APIs
All data presented on the dashboard are retrieved from [Covalent's Uniswap Clone Endpoints](https://www.covalenthq.com/docs/learn/guides/uniswap-clone).

## Technology stacks
This project is built as a serverless system, getting inspiration from the [Covalent AWS Serverless](https://github.com/nrsirapop/covalent-aws-serverless) project.

The technologies used include
- [React.js](https://reactjs.org) is used for building the user interface of the dashboard.
- [Covalent AWS Serverless](https://github.com/nrsirapop/covalent-aws-serverless) is used as a bridge of requesting data from Covalent's endpoints with our serverless setup.
- [AWS Lambda](https://aws.amazon.com/lambda) is used for setting up a lambda function to retrieve the data from [Covalent API](https://www.covalenthq.com/docs/api/).
- [AWS S3](https://aws.amazon.com/s3) service is used for hosting the dashboard as a static website.

The setup instructions can be found in the [README.md](https://github.com/nrsirapop/covalent-aws-serverless#readme) of the Covalent AWS Serverless project

### Note
The project is built as a part of the [coinhippo.io](https://coinhippo.io) website.
