//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

interface IERC5192 {
    event Locked(uint256 tokenId);

    event Unlocked(uint256 tokenId);

    function locked(uint256 tokenId) external view returns (bool);
}

abstract contract ERC5192 is IERC5192 {
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual returns (bool) {
        return interfaceId == type(IERC5192).interfaceId;
    }
}
