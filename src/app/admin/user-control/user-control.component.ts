import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, CreateUserRequest, UpdateUserRequest } from '../../core/services/user.service';
import { User } from '../../core/models/product.models';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

interface UserWithSelection extends User {
  selected?: boolean;
}

@Component({
  selector: 'app-user-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './user-control.component.html',
  styleUrl: './user-control.component.scss'
})
export class UserControlComponent implements OnInit {
  // State
  users: UserWithSelection[] = [];
  filteredUsers: UserWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search and Filter
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';

  // Modals
  showUserModal = false;
  showPasswordModal = false;
  showDeleteModal = false;
  isEditMode = false;

  // Forms
  userForm: CreateUserRequest & { _id?: string } = {
    name: '',
    email: '',
    password: '',
    role: 'employee'
  };

  newPassword = '';
  showPassword = false;
  showNewPassword = false;

  // Selected User
  selectedUser: UserWithSelection | null = null;
  usersToDelete: UserWithSelection[] = [];
  currentUserId: string = ''; // Set this from auth service

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.getCurrentUser();
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

  loadUsers(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.getAllUsers().subscribe({
      next: (response) => {
        // Handle different possible response structures
        let usersArray: User[] = [];

        if (response.data) {
          usersArray = Array.isArray(response.data) ? response.data : [response.data];
        } else if (response.users) {
          usersArray = response.users;
        } else if (response.user) {
          usersArray = [response.user];
        }

        this.users = usersArray.map(user => ({
          ...user,
          selected: false,
          isActive: user.isActive !== undefined ? user.isActive : true,
          name: user.name || user.username || 'مستخدم'
        }));
        this.filteredUsers = [...this.users];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = error.error?.message || 'حدث خطأ أثناء تحميل المستخدمين';
        this.isLoading = false;
      }
    });
  }

  getCurrentUser(): void {
    // TODO: Get current user ID from auth service
    // For now, you can set it manually or get it from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.currentUserId = user._id || user.id;
    }
  }

  // ═══════════════════════════════════════════════════════
  // Search and Filter
  // ═══════════════════════════════════════════════════════

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      // Search filter
      const userName = user.name || user.username || '';
      const userEmail = user.email || '';
      const matchesSearch = !this.searchTerm ||
        userName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        userEmail.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Role filter (exclude 'customer' role from admin/employee filter)
      const matchesRole = !this.selectedRole || user.role === this.selectedRole;

      // Status filter
      const userIsActive = user.isActive !== undefined ? user.isActive : true;
      const matchesStatus = !this.selectedStatus ||
        (this.selectedStatus === 'active' && userIsActive) ||
        (this.selectedStatus === 'inactive' && !userIsActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredUsers.filter(u => u.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredUsers.length > 0 &&
      this.filteredUsers.every(u => u.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredUsers.forEach(user => user.selected = newState);
  }

  updateSelectAll(): void {
    // This is called when individual checkboxes change
    // No action needed, just triggers change detection
  }

  // ═══════════════════════════════════════════════════════
  // Add User
  // ═══════════════════════════════════════════════════════

  openAddUserModal(): void {
    this.isEditMode = false;
    this.userForm = {
      name: '',
      email: '',
      password: '',
      role: 'employee'
    };
    this.showUserModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Edit User
  // ═══════════════════════════════════════════════════════

  openEditUserModal(user: UserWithSelection): void {
    this.isEditMode = true;
    this.selectedUser = user;
    this.userForm = {
      _id: user._id,
      name: user.name || user.username || '',
      email: user.email,
      password: '', // Don't populate password
      role: (user.role === 'admin' || user.role === 'employee') ? user.role : 'employee'
    };
    this.showUserModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Save User (Create or Update)
  // ═══════════════════════════════════════════════════════

  saveUser(): void {
    if (!this.validateUserForm()) {
      return;
    }

    this.isSaving = true;

    if (this.isEditMode && this.userForm._id) {
      // Update user
      const updateData: UpdateUserRequest = {
        name: this.userForm.name,
        email: this.userForm.email,
        role: this.userForm.role
      };

      this.userService.updateUser(this.userForm._id, updateData).subscribe({
        next: (response) => {
          this.showToastMessage('تم تحديث المستخدم بنجاح', 'success');
          this.loadUsers();
          this.closeUserModal();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.showToastMessage(
            error.error?.message || 'حدث خطأ أثناء تحديث المستخدم',
            'error'
          );
          this.isSaving = false;
        }
      });
    } else {
      // Create user
      const createData: CreateUserRequest = {
        name: this.userForm.name,
        email: this.userForm.email,
        password: this.userForm.password,
        role: this.userForm.role
      };

      this.userService.createUser(createData).subscribe({
        next: (response) => {
          this.showToastMessage('تم إضافة المستخدم بنجاح', 'success');
          this.loadUsers();
          this.closeUserModal();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.showToastMessage(
            error.error?.message || 'حدث خطأ أثناء إضافة المستخدم',
            'error'
          );
          this.isSaving = false;
        }
      });
    }
  }

  validateUserForm(): boolean {
    if (!this.userForm.name.trim()) {
      this.showToastMessage('يرجى إدخال اسم المستخدم', 'error');
      return false;
    }

    if (!this.userForm.email.trim() || !this.isValidEmail(this.userForm.email)) {
      this.showToastMessage('يرجى إدخال بريد إلكتروني صحيح', 'error');
      return false;
    }

    if (!this.isEditMode && (!this.userForm.password || this.userForm.password.length < 6)) {
      this.showToastMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
      return false;
    }

    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
    this.showPassword = false;
  }

  // ═══════════════════════════════════════════════════════
  // Change Password
  // ═══════════════════════════════════════════════════════

  openPasswordModal(user: UserWithSelection): void {
    this.selectedUser = user;
    this.newPassword = '';
    this.showNewPassword = false;
    this.showPasswordModal = true;
  }

  updatePassword(): void {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.showToastMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
      return;
    }

    if (!this.selectedUser?._id) {
      return;
    }

    this.isSaving = true;

    this.userService.updateUserPassword(this.selectedUser._id, this.newPassword).subscribe({
      next: (response) => {
        this.showToastMessage('تم تحديث كلمة المرور بنجاح', 'success');
        this.closePasswordModal();
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error updating password:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء تحديث كلمة المرور',
          'error'
        );
        this.isSaving = false;
      }
    });
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.selectedUser = null;
    this.newPassword = '';
    this.showNewPassword = false;
  }

  // ═══════════════════════════════════════════════════════
  // Delete User
  // ═══════════════════════════════════════════════════════

  confirmDeleteUser(user: UserWithSelection): void {
    if (user._id === this.currentUserId) {
      this.showToastMessage('لا يمكنك حذف حسابك الخاص', 'error');
      return;
    }

    this.selectedUser = user;
    this.usersToDelete = [user];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.usersToDelete = this.filteredUsers.filter(u =>
      u.selected && u._id !== this.currentUserId
    );

    if (this.usersToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد مستخدمين للحذف', 'error');
      return;
    }

    this.showDeleteModal = true;
  }

  deleteUsers(): void {
    this.isDeleting = true;

    const deletePromises = this.usersToDelete.map(user =>
      this.userService.deleteUser(user._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.usersToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'مستخدم' : 'مستخدمين'} بنجاح`,
          'success'
        );
        this.loadUsers();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting users:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف المستخدمين',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
    this.usersToDelete = [];
  }

  // ═══════════════════════════════════════════════════════
  // Toast Notifications
  // ═══════════════════════════════════════════════════════

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
