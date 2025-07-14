//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./EduControl.sol";
import "./IERC5192.sol";

contract EduNFT is
    Initializable,
    Ownable2StepUpgradeable,
    ERC721URIStorageUpgradeable
{
    function initialize(
        address owner,
        string calldata name,
        string calldata symbol
    ) public initializer {
        __ERC721_init(name, symbol);
        __Ownable_init(owner);
    }

    function mint(
        address to,
        uint256 tokenId,
        string calldata tokenURI
    ) external onlyOwner {
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }
}
