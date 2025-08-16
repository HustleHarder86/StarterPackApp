// Realtor Profile Setup Component
const RealtorProfileSetup = ({ userId, onComplete }) => {
  const [profileData, setProfileData] = React.useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    licenseNumber: '',
    address: '',
    website: '',
    bio: ''
  });
  
  const [profilePicture, setProfilePicture] = React.useState(null);
  const [companyLogo, setCompanyLogo] = React.useState(null);
  const [profilePicPreview, setProfilePicPreview] = React.useState(null);
  const [logoPreview, setLogoPreview] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  // Load existing profile if available
  React.useEffect(() => {
    loadExistingProfile();
  }, [userId]);

  const loadExistingProfile = async () => {
    if (!userId || !window.firebaseWrapper) return;
    
    try {
      const db = window.firebaseWrapper.db;
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.realtorProfile) {
          setProfileData(userData.realtorProfile);
          if (userData.realtorProfile.profilePicUrl) {
            setProfilePicPreview(userData.realtorProfile.profilePicUrl);
          }
          if (userData.realtorProfile.logoUrl) {
            setLogoPreview(userData.realtorProfile.logoUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'profile') {
        setProfilePicture(file);
        setProfilePicPreview(reader.result);
      } else {
        setCompanyLogo(file);
        setLogoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!profileData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[\d\s\-\(\)\+]+$/.test(profileData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file, path) => {
    if (!file || !window.firebaseWrapper) return null;
    
    try {
      const storage = window.firebaseWrapper.storage;
      const storageRef = storage.ref(path);
      const snapshot = await storageRef.put(file);
      const downloadUrl = await snapshot.ref.getDownloadURL();
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      let profilePicUrl = profilePicPreview;
      let logoUrl = logoPreview;
      
      // Upload new profile picture if selected
      if (profilePicture) {
        profilePicUrl = await uploadFile(
          profilePicture,
          `profiles/${userId}/profile-picture.${profilePicture.name.split('.').pop()}`
        );
      }
      
      // Upload new company logo if selected
      if (companyLogo) {
        logoUrl = await uploadFile(
          companyLogo,
          `profiles/${userId}/company-logo.${companyLogo.name.split('.').pop()}`
        );
      }
      
      // Save profile data to Firestore
      const db = window.firebaseWrapper.db;
      await db.collection('users').doc(userId).update({
        realtorProfile: {
          ...profileData,
          profilePicUrl,
          logoUrl,
          updatedAt: new Date().toISOString()
        }
      });
      
      alert('Profile saved successfully!');
      if (onComplete) onComplete();
      
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return React.createElement('div', {
    className: 'max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg'
  },
    React.createElement('h2', {
      className: 'text-2xl font-bold mb-6 text-gray-900'
    }, 'Realtor Profile Setup'),
    
    React.createElement('p', {
      className: 'text-gray-600 mb-6'
    }, 'Set up your professional profile to personalize your client reports with your branding.'),
    
    // Profile Picture and Logo Section
    React.createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'
    },
      // Profile Picture
      React.createElement('div', {},
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-2'
        }, 'Profile Picture'),
        React.createElement('div', {
          className: 'flex items-center space-x-4'
        },
          React.createElement('div', {
            className: 'w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden'
          },
            profilePicPreview ? 
              React.createElement('img', {
                src: profilePicPreview,
                alt: 'Profile',
                className: 'w-full h-full object-cover'
              }) :
              React.createElement('svg', {
                className: 'w-12 h-12 text-gray-400',
                fill: 'currentColor',
                viewBox: '0 0 20 20'
              },
                React.createElement('path', {
                  fillRule: 'evenodd',
                  d: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z',
                  clipRule: 'evenodd'
                })
              )
          ),
          React.createElement('input', {
            type: 'file',
            accept: 'image/*',
            onChange: (e) => handleFileChange(e, 'profile'),
            className: 'hidden',
            id: 'profile-pic-upload'
          }),
          React.createElement('label', {
            htmlFor: 'profile-pic-upload',
            className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer'
          }, 'Upload Photo')
        )
      ),
      
      // Company Logo
      React.createElement('div', {},
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-2'
        }, 'Company Logo'),
        React.createElement('div', {
          className: 'flex items-center space-x-4'
        },
          React.createElement('div', {
            className: 'w-24 h-24 rounded bg-gray-200 flex items-center justify-center overflow-hidden'
          },
            logoPreview ? 
              React.createElement('img', {
                src: logoPreview,
                alt: 'Logo',
                className: 'w-full h-full object-contain'
              }) :
              React.createElement('svg', {
                className: 'w-12 h-12 text-gray-400',
                fill: 'currentColor',
                viewBox: '0 0 20 20'
              },
                React.createElement('path', {
                  fillRule: 'evenodd',
                  d: 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z',
                  clipRule: 'evenodd'
                })
              )
          ),
          React.createElement('input', {
            type: 'file',
            accept: 'image/*',
            onChange: (e) => handleFileChange(e, 'logo'),
            className: 'hidden',
            id: 'logo-upload'
          }),
          React.createElement('label', {
            htmlFor: 'logo-upload',
            className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer'
          }, 'Upload Logo')
        )
      )
    ),
    
    // Form Fields
    React.createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-2 gap-6'
    },
      // Name
      React.createElement('div', {},
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-1'
        }, 'Full Name *'),
        React.createElement('input', {
          type: 'text',
          name: 'name',
          value: profileData.name,
          onChange: handleInputChange,
          className: `w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`,
          placeholder: 'John Smith'
        }),
        errors.name && React.createElement('p', {
          className: 'mt-1 text-sm text-red-600'
        }, errors.name)
      ),
      
      // Company
      React.createElement('div', {},
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-1'
        }, 'Company'),
        React.createElement('input', {
          type: 'text',
          name: 'company',
          value: profileData.company,
          onChange: handleInputChange,
          className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
          placeholder: 'ABC Realty Inc.'
        })
      ),
      
      // Email
      React.createElement('div', {},
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-1'
        }, 'Email *'),
        React.createElement('input', {
          type: 'email',
          name: 'email',
          value: profileData.email,
          onChange: handleInputChange,
          className: `w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`,
          placeholder: 'john@example.com'
        }),
        errors.email && React.createElement('p', {
          className: 'mt-1 text-sm text-red-600'
        }, errors.email)
      ),
      
      // Phone
      React.createElement('div', {},
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-1'
        }, 'Phone *'),
        React.createElement('input', {
          type: 'tel',
          name: 'phone',
          value: profileData.phone,
          onChange: handleInputChange,
          className: `w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`,
          placeholder: '(555) 123-4567'
        }),
        errors.phone && React.createElement('p', {
          className: 'mt-1 text-sm text-red-600'
        }, errors.phone)
      ),
      
      // License Number
      React.createElement('div', {},
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-1'
        }, 'License Number'),
        React.createElement('input', {
          type: 'text',
          name: 'licenseNumber',
          value: profileData.licenseNumber,
          onChange: handleInputChange,
          className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
          placeholder: 'DRE #12345678'
        })
      ),
      
      // Website
      React.createElement('div', {},
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-1'
        }, 'Website'),
        React.createElement('input', {
          type: 'url',
          name: 'website',
          value: profileData.website,
          onChange: handleInputChange,
          className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
          placeholder: 'https://www.example.com'
        })
      )
    ),
    
    // Address (full width)
    React.createElement('div', {
      className: 'mt-6'
    },
      React.createElement('label', {
        className: 'block text-sm font-medium text-gray-700 mb-1'
      }, 'Office Address'),
      React.createElement('input', {
        type: 'text',
        name: 'address',
        value: profileData.address,
        onChange: handleInputChange,
        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
        placeholder: '123 Main St, Suite 100, City, State 12345'
      })
    ),
    
    // Bio (full width)
    React.createElement('div', {
      className: 'mt-6'
    },
      React.createElement('label', {
        className: 'block text-sm font-medium text-gray-700 mb-1'
      }, 'Professional Bio'),
      React.createElement('textarea', {
        name: 'bio',
        value: profileData.bio,
        onChange: handleInputChange,
        rows: 4,
        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
        placeholder: 'Tell your clients about your experience and expertise...'
      })
    ),
    
    // Save Button
    React.createElement('div', {
      className: 'mt-8 flex justify-end'
    },
      React.createElement('button', {
        onClick: handleSave,
        disabled: isSaving,
        className: 'px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
      },
        isSaving && React.createElement('svg', {
          className: 'animate-spin h-5 w-5',
          xmlns: 'http://www.w3.org/2000/svg',
          fill: 'none',
          viewBox: '0 0 24 24'
        },
          React.createElement('circle', {
            className: 'opacity-25',
            cx: '12',
            cy: '12',
            r: '10',
            stroke: 'currentColor',
            strokeWidth: '4'
          }),
          React.createElement('path', {
            className: 'opacity-75',
            fill: 'currentColor',
            d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          })
        ),
        isSaving ? 'Saving...' : 'Save Profile'
      )
    )
  );
};

// Export for use in other components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RealtorProfileSetup;
}