// SPDX-License-Identifier: MIT
/// @author Guillaume Lethuillier

pragma solidity ^0.8.0;

import "./zkpToken.sol";
import "./zkpVerifier.sol";

// This contract manages the hospital's public keys and verifies, directly and indirectly
// (by calling the proof of provenance verifier contracts), the zero-knowledge proofs
contract ZkpContract {
    address private _owner;
    ZkpToken private _zkpToken;
    ZkpVerifier private _zkpVerifier;

    // Public keys
    event PublicKeyVersion(uint);

    // name => list of public keys
    mapping(string => string[]) public publicKeys;

    // name => token ID
    // (used to prevent an hospital to associate its public key
    // with a name that is not its own)
    mapping(string => uint256) private _tokenIds;

    // Signatures: hash(signature) => hash(public key)
    mapping(bytes32 => bytes32) private _signatures;

    constructor(address zkpTokenAddress, address zkpVerifierAddress) {
        _owner = msg.sender;
        _zkpToken = ZkpToken(zkpTokenAddress);
        _zkpVerifier = ZkpVerifier(zkpVerifierAddress);
    }

    // PUBLIC KEYS MANAGEMENT

    function getPublicKey(
        string memory name,
        uint version
    ) external view returns (string memory) {
        require(version < publicKeys[name].length, "Public key does not exist");
        return publicKeys[name][version];
    }

    function getLatestPublicKey(
        string memory name
    ) external view returns (string memory) {
        require(
            publicKeys[name].length > 0,
            "Public key does not exist for this token ID and name"
        );
        uint lastIndex = publicKeys[name].length - 1;
        return publicKeys[name][lastIndex];
    }

    function setPublicKey(
        string memory name,
        string memory publicKey
    ) external returns (uint) {
        // guard clauses
        // 1) public key cannot be empty (TODO: ensure it is valid)
        // 2) caller of the function has to own an NFT
        require(bytes(publicKey).length != 0, "Public key cannot be empty");
        uint256 tokenId = _zkpToken.userToToken(msg.sender);
        require(tokenId > 0, "Caller is not authorized to set a public key");

        if (publicKeys[name].length > 0) {
            // 3) if the name is already used, only the hospital which
            //    used it first can upload a new public key associated
            //    with this name
            require(
                tokenId == _tokenIds[name],
                "Caller is not authorized to update the public key"
            );
        } else {
            // associate the name with the token ID
            _tokenIds[name] = tokenId;
        }

        publicKeys[name].push(publicKey);

        uint version = publicKeys[name].length - 1;
        emit PublicKeyVersion(version);
        return version;
    }

    // ZKP PROOF VERIFICATION

    // public key `x` and `y`
    struct PublicKeyPoints {
        bytes x;
        bytes y;
    }

    // extract the public key points `x` and `y` from the public key
    function getPublicKeyPoints(
        bytes calldata publicKey
    ) internal pure returns (PublicKeyPoints memory) {
        // `x` is at position [O, 32) in the public key
        bytes calldata publicKey_x = publicKey[0:32];
        // `y` is at position [32, 64) in the public key
        bytes calldata publicKey_y = publicKey[32:64];

        return PublicKeyPoints(publicKey_x, publicKey_y);
    }

    // public inputs of the proof of provenance (PoP) proof
    // (public key points and signature)
    struct PublicInputsPoP {
        PublicKeyPoints publicKeyPoints;
        bytes signature;
    }

    // extract the public inputs embedded in the PoP proof
    function extractPublicInputsPoP(
        bytes calldata proof
    ) internal pure returns (PublicInputsPoP memory) {
        bytes memory signature = new bytes(64);
        uint filteredIndex = 0;
        for (uint i = 95; i < 2112; i += 32) {
            signature[filteredIndex] = proof[i];
            filteredIndex++;
        }

        // Public key x is at position [0:32)
        // Public key y is at position [32:64)
        // Signature is at position [95:2112) mod 32 (see above)
        return
            PublicInputsPoP(
                PublicKeyPoints(proof[0:32], proof[32:64]),
                signature
            );
    }

    // store a signature as a keccak256 hash
    function storeSignature(
        bytes calldata publicKey,
        bytes calldata signature
    ) external {
        require(
            _zkpToken.userToToken(msg.sender) > 0,
            "Caller is not authorized to store a signature"
        );

        PublicKeyPoints memory points = getPublicKeyPoints(publicKey);

        _signatures[keccak256(signature)] = keccak256(
            abi.encodePacked(points.x, points.y)
        );
    }

    // check whether a signature has been stored or not
    function checkSignature(
        bytes calldata publicKey,
        bytes calldata signature
    ) external view returns (bool) {
        PublicKeyPoints memory points = getPublicKeyPoints(publicKey);

        return
            _signatures[keccak256(signature)] ==
            keccak256(abi.encodePacked(points.x, points.y));
    }

    // Verify the public inputs of the PoP proof
    function verifyPublicInputsPoP(
        bytes calldata publicKey,
        bytes calldata proof
    ) external view returns (bool) {
        // extract public key from proof
        PublicInputsPoP memory publicInputs = extractPublicInputsPoP(proof);
        PublicKeyPoints memory points = getPublicKeyPoints(publicKey);

        // verify that:
        // 1) public key x extracted from the proof corresponds to the expected one
        // 2) public key y extracted from the proof corresponds to the expected one
        // 3) the signature has been stored and corresponds to the expected public key
        return
            keccak256(abi.encodePacked(points.x)) ==
            keccak256(abi.encodePacked(publicInputs.publicKeyPoints.x)) &&
            keccak256(abi.encodePacked(points.y)) ==
            keccak256(abi.encodePacked(publicInputs.publicKeyPoints.y)) &&
            _signatures[keccak256(publicInputs.signature)] ==
            keccak256(abi.encodePacked(points.x, points.y));
    }

    // verify the PoP proof by calling the verifier contract
    function verifyProofPoP(
        bytes calldata proof
    ) external view returns (bool result) {
        return _zkpVerifier.verify(proof);
    }
}
