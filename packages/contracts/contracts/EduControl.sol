//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/IBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "./EduNFT.sol";

contract EduControl is Initializable, AccessControlUpgradeable, IBeacon {
    event NewEduNftCreated(
        address indexed owner,
        address indexed contractAddress
    );

    /// @custom:storage-location erc7201:edudao.storage.EduControl
    struct EduControlStorage {
        EduNFT implementation;
    }

    /// @dev keccak256(abi.encode(uint256(keccak256("edudao.storage.EduControl")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant EDUCONTROL_STORAGE_LOCATION =
        0x55b6b9251cb334e3958d3c61b6cd0c72a19feb06b7c99f3c50d6684234877800;

    function _getEduControlStorage()
        private
        pure
        returns (EduControlStorage storage $)
    {
        assembly {
            $.slot := EDUCONTROL_STORAGE_LOCATION
        }
    }

    function initialize(
        address admin,
        EduNFT implementation_
    ) public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        EduControlStorage storage $ = _getEduControlStorage();
        $.implementation = implementation_;
    }

    function implementation() public view virtual returns (address) {
        EduControlStorage storage $ = _getEduControlStorage();
        return address($.implementation);
    }

    function upgradeTo(
        EduNFT newImpl
    ) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        if (address(newImpl).code.length == 0) {
            revert UpgradeableBeacon.BeaconInvalidImplementation(
                address(newImpl)
            );
        }
        EduControlStorage storage $ = _getEduControlStorage();
        $.implementation = newImpl;
        emit UpgradeableBeacon.Upgraded(address(newImpl));
    }

    function createEduNft(
        address owner,
        string calldata name,
        string calldata symbol
    ) public onlyRole(DEFAULT_ADMIN_ROLE) returns (EduNFT) {
        bytes memory data = abi.encodeCall(
            EduNFT.initialize,
            (owner, name, symbol)
        );

        BeaconProxy deployed = new BeaconProxy(address(this), data);

        emit NewEduNftCreated(address(deployed), owner);

        return EduNFT(address(deployed));
    }
}
