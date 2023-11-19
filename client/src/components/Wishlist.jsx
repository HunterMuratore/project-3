import React, { useEffect, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

import Alert from "./Alert";

const GET_WISHLISTS = gql`
  query GetWishlists {
    getWishlists {
      _id
      name
    }
  }
`;
const CREATE_WISHLIST = gql`
  mutation CreateWishlist($name: String!) {
    createWishlist(name: $name) {
      _id
      name
    }
  }
`;

const DELETE_WISHLIST = gql`
  mutation DeleteWishlist($id: ID!) {
    deleteWishlist(id: $id) {
      _id
    }
  }
`;

const UPDATE_WISHLIST = gql `
mutation UpdateWishlist($id: ID!, $name: String!) {
   updateWishlist(id: $id, name: $name) {
    _id
    name
   }
}
`

function Wishlist({ handleClose, userId }) {
  const [wishlistName, setWishlistName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState({ id: "", edit: false });
  const [wishlists, setWishlists] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const { loading, error, data, refetch } = useQuery(GET_WISHLISTS);
  const [CreateWishlistMutation] = useMutation(CREATE_WISHLIST);
  const [UpdateWishlistMutation] = useMutation(UPDATE_WISHLIST);
  const [DeleteWishlistMutation] = useMutation(DELETE_WISHLIST, {
    update(cache, { data: { deleteWishlist } }) {
      const existingWishlists = cache.readQuery({
        query: GET_WISHLISTS,
      });

      const updatedWishlists = existingWishlists.getWishlists.filter(
        (wishlist) => wishlist._id !== deleteWishlist._id
      );

      cache.writeQuery({
        query: GET_WISHLISTS,
        data: {
          getWishlists: updatedWishlists,
        },
      });
    },
  });

  const showAlert = (message) => {
    setAlertMessage(message);
    // Reset alert message after 3 seconds
    setTimeout(() => {
      setAlertMessage("");
    }, 3000);
  };

  const handleDeleteWhishlist = async (wishlistId) => {
    try {
      const result = await DeleteWishlistMutation({
        variables: { id: wishlistId },
      });

      showAlert("Wishlist Deleted! Congrats?");
      refetch();
    } catch (error) {
      console.error("Failed to delete wishlist, this is for the best");
    }
  };

  useEffect(() => {
    if (!loading && data && data.getWishlists) {
      setWishlists(data.getWishlists);
    }
  }, [loading, data]);

  const handleUpdateWishlist = (wishlistId, wishlistName) => {
    setEditMode({ id: wishlistId, edit: true });
    setWishlistName(wishlistName);
  };

  const handleInputChange = (e) => {
    setWishlistName(e.target.value);
  };

  const handleEditSubmit = async (wishlistId) => {
    try {
      const result = await UpdateWishlistMutation({
        variables: { id: wishlistId, name: wishlistName },
        context: {
          headers: {
            authorization: userId,
          },
        },
      });

      showAlert("Wishlist Updated!");
      setEditMode({ id: '', edit: false})
      refetch();
    } catch (error) {
      console.error("Failed to update wihslist");
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await CreateWishlistMutation({
        variables: { name: wishlistName },
        context: {
          headers: {
            authorization: userId,
          },
        },
      });

      showAlert(`Wishlist '${result.data.createWishlist.name}' created!`);
      setShowForm(false);
      refetch();
    } catch (error) {
      console.error("Failed to load wishlists");
    }
  };

  const handleCreateToggle = () => {
    setShowForm(!showForm);
  };

  return (
    <div className="container wishlists">
      <div className="row">
        <div className="col">
          <div className="d-flex justify-content-between mb-3">
            <h3>Wishlist Items</h3>
            <button
              className="my-btn"
              onClick={handleCreateToggle}
            >
              Create Wishlist
            </button>
          </div>
          <div>{alertMessage && <Alert message={alertMessage} onClose={() => setAlertMessage("")} />}</div>
          <div className="wishlist-list list-group rounded">
            {wishlists.map((wishlist) => (
              <div
                key={wishlist._id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                {editMode.edit && editMode.id === wishlist._id ? (
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      value={wishlistName}
                      onChange={handleInputChange}
                    />
                    <button
                      className="my-btn mt-2"
                      onClick={() => handleEditSubmit(wishlist._id)}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="wishlist w-100 rounded">
                    <p className="wishlist-name">{wishlist.name}</p>
                    <div className="ms-auto">
                      <button
                        className="my-btn mr-2"
                        onClick={() =>
                          handleUpdateWishlist(wishlist._id, wishlist.name)
                        }
                      >
                       <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="my-btn ms-2"
                        onClick={() => handleDeleteWhishlist(wishlist._id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="row my-4">
          <div className="col">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="wishlistName">Wishlist Name:</label>
                <input
                  type="text"
                  className="form-control mb-2"
                  id="wishlistName"
                  value={wishlistName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit" className="my-btn me-2">
                Create Wishlist
              </button>
              <button
                className="my-btn ml-2"
                onClick={handleCreateToggle}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wishlist;