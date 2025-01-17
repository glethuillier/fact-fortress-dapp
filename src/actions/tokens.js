const { contractsHelper } = require('../contracts/contracts.js');

async function authorizeProvider(from, recipient) {
    const sc = contractsHelper.getContractByName("DataProvidersNFTs");

    try {
        const receipt = await sc.methods.authorizeProvider(recipient).send({ from, gas: '1000000' });
        const tokenId = receipt.events.Transfer.returnValues.tokenId;
        console.log(`data provider authorized: ${tokenId} — tx ${receipt.transactionHash}`);
        return {
            recipient,
            token_id: tokenId,
        };
    } catch (e) {
        console.error(e.reason);
        return {
            error: e
        };
    }
}

async function unauthorizeProvider(from, address) {
    const sc = contractsHelper.getContractByName("DataProvidersNFTs");

    try {
        await sc.methods.unauthorizeProvider(address).send({ from, gas: '1000000' });
        console.log(`[reset] Data provider ${address} has been unauthorized`);
        return {
            address,
            "unauthorized": true,
        };
    } catch (e) {
        console.error(e);
        return {
            error: "Address does not have a token",
        };
    }
}

async function authorizeAnalyzer(from, recipient, accessPolicies) {
    const sc = contractsHelper.getContractByName("DataAnalyzersNFTs");

    try {
        const receipt = await sc.methods.authorizeAnalyzer(
            recipient,
            accessPolicies
        ).send({ from, gas: '1000000' });
        const tokenId = receipt.events.Transfer.returnValues.tokenId;
        console.log(`data analyzer authorized: ${tokenId} (${accessPolicies}) tx ${receipt.transactionHash}`);
        return {
            "address": recipient,
            token_id: tokenId,
        };
    } catch (e) {
        console.error(e.reason);
        return {
            error: e
        };
    }
}

async function unauthorizeAnalyzer(from, address) {
    const sc = contractsHelper.getContractByName("DataAnalyzersNFTs");

    try {
        await sc.methods.unauthorizeAnalyzer(address).send({ from, gas: '1000000' });
        console.log(`[reset] Data analyzer ${address} has been unauthorized`);
        return {
            address,
            "unauthorized": true,
        };
    } catch (e) {
        console.error(e);
        return {
            error: "Address does not have a token",
        };
    }
}


async function getProviderTokenId(address) {
    const sc = contractsHelper.getContractByName("DataProvidersNFTs");

    try {
        const tokenId = await sc.methods.userToToken(address).call();
        console.log(`Address ${address} has token #${tokenId}`);

        if (tokenId == 0) {
            return {
                error: "Address does not have a token",
            };
        }

        return {
            address,
            token_id: tokenId,
        };
    } catch (e) {
        console.error(e);
        return {
            error: "Address does not have a token",
        };
    }
}

async function getAnalyzerTokenId(address) {
    const sc = contractsHelper.getContractByName("DataAnalyzersNFTs");

    try {
        const tokenId = await sc.methods.userToToken(address).call();
        console.log(`Address ${address} has token #${tokenId}`);

        if (tokenId._tokenId == 0) {
            return {
                error: "Address does not have a token",
            };
        }

        return {
            address,
            token_id: tokenId._tokenId,
            access_policies: tokenId._accessPolicies,
        };
    } catch (e) {
        console.error(e);
        return {
            error: "Address does not have a token",
        };
    }
}

async function getAllAccessPolicies() {
    const sc = contractsHelper.getContractByName("DataAnalyzersNFTs");

    try {
        const accessPolicies = await sc.methods.getAllAccessPolicies().call();
        console.log(`All access policies: ${accessPolicies}`);
        return {
            "access_policies": accessPolicies,
        };
    } catch (e) {
        console.error(e);
        return {
            error: "Address does not have a token",
        };
    }
}

async function removeAllAccessPolicies(from) {
    const sc = contractsHelper.getContractByName("DataAnalyzersNFTs");

    try {
        await sc.methods.removeAllAccessPolicies().send({ from, gas: '1000000' });
        console.log(`[reset] All access policies have been removed`);
        return {
            "access_policies_resetted": true,
        };
    } catch (e) {
        console.error(e);
        return {
            error: e,
        };
    }
}

async function getAccessPolicies(address) {
    const sc = contractsHelper.getContractByName("DataAnalyzersNFTs");

    try {
        const accessPolicies = await sc.methods.getAccessPolicies(address).call();
        console.log(`Address ${address} has access policies #${accessPolicies}`);
        return {
            address,
            "access_policies": accessPolicies,
        };
    } catch (e) {
        console.error(e);
        return {
            error: "Address does not have a token",
        };
    }
}



module.exports = {
    authorizeProvider,
    unauthorizeProvider,
    authorizeAnalyzer,
    unauthorizeAnalyzer,
    getProviderTokenId,
    getAnalyzerTokenId,
    getAllAccessPolicies,
    removeAllAccessPolicies,
    getAccessPolicies
};