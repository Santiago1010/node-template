#!/bin/bash
# Production RSA key generation script for secure HTTP encryption
# This script generates RSA key pairs for production environments

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Configuration variables
KEYS_DIR="./kubernetes/keys"
PRIVATE_KEY_FILE="$KEYS_DIR/private.pem"
PUBLIC_KEY_FILE="$KEYS_DIR/public.pem"
KEY_SIZE=2048  # RSA key size in bits (minimum 2048 for security)

# Colors for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if OpenSSL is available
check_openssl() {
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is not installed or not in PATH"
        print_info "Please install OpenSSL to generate RSA keys"
        exit 1
    fi

    local openssl_version=$(openssl version)
    print_info "Using OpenSSL: $openssl_version"
}

# Function to create keys directory
create_keys_directory() {
    if [ ! -d "$KEYS_DIR" ]; then
        print_info "Creating keys directory: $KEYS_DIR"
        mkdir -p "$KEYS_DIR"
        print_success "Keys directory created successfully"
    else
        print_info "Keys directory already exists: $KEYS_DIR"
    fi
}

# Function to check if keys already exist
check_existing_keys() {
    if [ -f "$PRIVATE_KEY_FILE" ] || [ -f "$PUBLIC_KEY_FILE" ]; then
        print_warning "RSA keys already exist in $KEYS_DIR"

        # Prompt user for confirmation to overwrite
        read -p "Do you want to overwrite existing keys? (y/N): " -n 1 -r
        echo

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Key generation cancelled by user"
            exit 0
        fi

        print_warning "Overwriting existing RSA keys..."
    fi
}

# Function to generate RSA private key
generate_private_key() {
    print_info "Generating $KEY_SIZE-bit RSA private key..."

    # Generate private key with proper security settings
    openssl genrsa -out "$PRIVATE_KEY_FILE" $KEY_SIZE

    if [ $? -eq 0 ]; then
        print_success "Private key generated successfully: $PRIVATE_KEY_FILE"
    else
        print_error "Failed to generate private key"
        exit 1
    fi
}

# Function to extract public key from private key
generate_public_key() {
    print_info "Extracting public key from private key..."

    # Extract public key from private key
    openssl rsa -in "$PRIVATE_KEY_FILE" -pubout -out "$PUBLIC_KEY_FILE"

    if [ $? -eq 0 ]; then
        print_success "Public key extracted successfully: $PUBLIC_KEY_FILE"
    else
        print_error "Failed to extract public key"
        exit 1
    fi
}

# Function to set secure file permissions
set_secure_permissions() {
    print_info "Setting secure file permissions..."

    # Private key: read-only for owner only (400)
    chmod 400 "$PRIVATE_KEY_FILE"
    print_info "Private key permissions set to 400 (read-only for owner)"

    # Public key: read-only for everyone (444)
    chmod 444 "$PUBLIC_KEY_FILE"
    print_info "Public key permissions set to 444 (read-only for all)"

    print_success "File permissions configured securely"
}

# Function to verify generated keys
verify_keys() {
    print_info "Verifying generated RSA keys..."

    # Check if private key is valid
    if openssl rsa -in "$PRIVATE_KEY_FILE" -check -noout &> /dev/null; then
        print_success "Private key is valid"
    else
        print_error "Private key validation failed"
        exit 1
    fi

    # Check if public key is valid
    if openssl rsa -pubin -in "$PUBLIC_KEY_FILE" -check -noout &> /dev/null; then
        print_success "Public key is valid"
    else
        print_error "Public key validation failed"
        exit 1
    fi

    # Verify key pair match
    private_modulus=$(openssl rsa -in "$PRIVATE_KEY_FILE" -modulus -noout)
    public_modulus=$(openssl rsa -pubin -in "$PUBLIC_KEY_FILE" -modulus -noout)

    if [ "$private_modulus" = "$public_modulus" ]; then
        print_success "Key pair validation successful - keys match"
    else
        print_error "Key pair validation failed - keys do not match"
        exit 1
    fi
}

# Function to display key information
display_key_info() {
    print_info "RSA Key Information:"
    echo "=================="
    echo "Key Size: $KEY_SIZE bits"
    echo "Private Key: $PRIVATE_KEY_FILE"
    echo "Public Key: $PUBLIC_KEY_FILE"
    echo

    # Display key fingerprints for verification
    print_info "Key Fingerprints:"
    echo "Private Key SHA256:"
    openssl rsa -in "$PRIVATE_KEY_FILE" -pubout -outform DER 2>/dev/null | openssl dgst -sha256 -hex
    echo "Public Key SHA256:"
    openssl rsa -pubin -in "$PUBLIC_KEY_FILE" -outform DER 2>/dev/null | openssl dgst -sha256 -hex
}

# Function to generate Kubernetes secret YAML
generate_k8s_secret() {
    local secret_file="$KEYS_DIR/rsa-keys-secret.yaml"

    print_info "Generating Kubernetes secret YAML..."

    # Encode keys in base64 for Kubernetes secret
    local private_key_b64=$(base64 -w 0 "$PRIVATE_KEY_FILE")
    local public_key_b64=$(base64 -w 0 "$PUBLIC_KEY_FILE")

    # Create Kubernetes secret YAML
    cat > "$secret_file" << EOF
# Kubernetes Secret for RSA Keys
# Apply this secret to your cluster: kubectl apply -f $secret_file
apiVersion: v1
kind: Secret
metadata:
  name: rsa-keys
  namespace: default
  labels:
    app: node-template
    component: encryption
type: Opaque
data:
  private-key: $private_key_b64
  public-key: $public_key_b64
EOF

    print_success "Kubernetes secret YAML generated: $secret_file"
}

# Main function
main() {
    print_info "Starting RSA key generation for production environment"
    print_info "=========================================="

    # Pre-flight checks
    check_openssl
    create_keys_directory
    check_existing_keys

    # Generate keys
    generate_private_key
    generate_public_key

    # Security configuration
    set_secure_permissions

    # Validation
    verify_keys

    # Information display
    display_key_info

    # Kubernetes integration
    generate_k8s_secret

    print_success "=========================================="
    print_success "RSA key generation completed successfully!"
    print_info "Keys are ready for production deployment"

    # Security reminders
    echo
    print_warning "SECURITY REMINDERS:"
    echo "1. Keep private key secure and never expose it publicly"
    echo "2. Use Kubernetes secrets in production instead of volume mounts"
    echo "3. Regularly rotate keys according to your security policy"
    echo "4. Monitor access to keys and audit their usage"
}

# Execute main function if script is run directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
